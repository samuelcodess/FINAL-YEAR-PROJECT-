import { withTransaction } from "../database/transaction";
import { findEmployeeById } from "../repositories/employeeRepository";
import {
  createEvaluationRecord,
  insertEvaluationDetails,
  insertRecommendations,
  listEvaluationsForRole,
  listPreviousScores
} from "../repositories/evaluationRepository";
import { listKpis as listKpisFromRepository, findKpisByIds, getTotalKpiWeight } from "../repositories/kpiRepository";
import { createNotification } from "../repositories/notificationRepository";
import { upsertLearningPathwayAssignment } from "../repositories/learningPathwayAssignmentRepository";
import type { AuthenticatedUser, EvaluationDetailInput } from "../types/domain";
import { ApiError } from "../utils/ApiError";
import { validateEvaluationSubmissionInput } from "../validators/evaluationValidators";
import {
  calculateSuggestedDueDate,
  ensureLearningPathwayAssignments,
  getConfiguredDefaultPathwayDeadlineDays
} from "./learningPathwayAssignmentService";
import {
  buildRecommendationExplanation,
  buildSupportMaterials,
  classifyPerformance,
  detectTrend,
  generateRecommendationTypes
  ,
  identifyFocusAreas
} from "./recommendationService";
import { generateAiEvaluation } from "./aiEvaluationService";
import { getEmployeeIdByUserId } from "./employeeService";
import { buildTaskEvaluationEvidence } from "./taskEvaluationEvidenceService";

export async function listEvaluations(user: AuthenticatedUser) {
  const employeeId = user.role === "employee" ? await getEmployeeIdByUserId(user.id) : null;

  return listEvaluationsForRole({
    role: user.role,
    userId: user.id,
    employeeId
  });
}

export async function createEvaluation(
  rawInput: {
    employeeId?: number;
    evaluationDate?: string;
    remarks?: string;
    periodStartDate?: string;
    periodEndDate?: string;
  },
  evaluator: AuthenticatedUser
) {
  const input = validateEvaluationSubmissionInput(rawInput);
  const employee = await findEmployeeById(input.employeeId);

  if (!employee) {
    throw new ApiError(404, "Selected employee was not found.");
  }

  const allKpis = await listKpisFromRepository();
  const totalAvailableWeight = await getTotalKpiWeight();
  const matchedKpis = await findKpisByIds(allKpis.map((kpi) => kpi.id));

  if (matchedKpis.length !== allKpis.length) {
    throw new ApiError(400, "The configured KPI set is incomplete and cannot be evaluated.");
  }

  const configuredWeight = matchedKpis.reduce(
    (sum, kpi) => sum + Number(kpi.weightPercentage),
    0
  );

  if (Number(configuredWeight.toFixed(2)) !== Number(totalAvailableWeight.toFixed(2))) {
    throw new ApiError(400, "Configured KPI weights do not match the expected total.");
  }

  const taskEvidence = await buildTaskEvaluationEvidence({
    employeeId: input.employeeId,
    periodStartDate: input.periodStartDate,
    periodEndDate: input.periodEndDate
  });

  if (taskEvidence.metrics.totalTasks === 0) {
    throw new ApiError(400, "No task records were found for the selected employee and evaluation period.");
  }

  const aiEvaluation = await generateAiEvaluation({
    employeeName: employee.fullName,
    remarks: input.remarks,
    kpis: matchedKpis,
    taskEvidence
  });
  const details: EvaluationDetailInput[] = aiEvaluation.details.map((detail) => ({
    kpiId: detail.kpiId,
    score: detail.score
  }));
  const totalScore = aiEvaluation.overallScore;
  const performanceLevel = classifyPerformance(totalScore);
  const previousScores = await listPreviousScores(input.employeeId);
  const trend = detectTrend(previousScores, totalScore);
  const recommendationTypes = generateRecommendationTypes(totalScore, previousScores);
  const focusAreas = identifyFocusAreas(details, matchedKpis);
  const explanation = buildRecommendationExplanation(
    recommendationTypes,
    totalScore,
    performanceLevel,
    trend,
    focusAreas
  );
  const materials = buildSupportMaterials(recommendationTypes, focusAreas);
  const defaultDeadlineDays = await getConfiguredDefaultPathwayDeadlineDays();

  const evaluationId = await withTransaction(async (connection) => {
    const nextEvaluationId = await createEvaluationRecord(connection, {
      employeeId: input.employeeId,
      evaluatorId: evaluator.id,
      evaluationDate: input.evaluationDate,
      totalScore,
      performanceLevel,
      recommendation: explanation,
      remarks: input.remarks,
      evidence: taskEvidence.summary,
      aiSummary: aiEvaluation.summary,
      evaluationMode: "ai",
      trend
    });

    await insertEvaluationDetails(connection, nextEvaluationId, details);
    await insertRecommendations(connection, {
      employeeId: input.employeeId,
      evaluationId: nextEvaluationId,
      types: recommendationTypes,
      explanation
    });

    return nextEvaluationId;
  });

  try {
    await ensureLearningPathwayAssignments(
      materials.map((material) => ({
        employeeId: input.employeeId,
        resourceId: material.resourceId,
        sourceEvaluationId: evaluationId,
        assignedBy: evaluator.id,
        dueDate: calculateSuggestedDueDate(material, defaultDeadlineDays)
      }))
    );
  } catch (error) {
    console.error("Learning pathway assignment failed after evaluation creation:", error);
  }

  try {
    await withTransaction(async (connection) => {
      await createNotification(connection, {
        userId: employee.userId,
        category: "recommendation",
        title: "New performance evaluation",
        message: `A new evaluation was recorded on ${input.evaluationDate}. Review your feedback and recommendations in the portal.`
      });

      if (recommendationTypes.includes("warning")) {
        await createNotification(connection, {
          userId: evaluator.id,
          category: "evaluation",
          title: "Declining performance warning",
          message: `${employee.fullName} has shown a decline across recent evaluations and may require intervention.`
        });
      }
    });
  } catch (error) {
    console.error("Evaluation notification dispatch failed after evaluation creation:", error);
  }

  return {
    evaluationId,
    employeeId: input.employeeId,
    totalScore,
    performanceLevel,
    trend,
    recommendationTypes,
    explanation,
    aiSummary: aiEvaluation.summary,
    evaluationSource: aiEvaluation.source,
    evaluationPeriod: {
      startDate: taskEvidence.periodStartDate,
      endDate: taskEvidence.periodEndDate
    },
    taskMetrics: taskEvidence.metrics,
    taskHighlights: taskEvidence.taskHighlights,
    strengths: aiEvaluation.strengths,
    risks: aiEvaluation.risks,
    evaluatedDetails: aiEvaluation.details.map((detail) => ({
      ...detail,
      kpiName: matchedKpis.find((kpi) => kpi.id === detail.kpiId)?.kpiName ?? "Unknown KPI"
    })),
    focusAreas,
    materials: materials.map((material) => ({
      ...material,
      completedModuleIndexes: []
    }))
  };
}
