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
  getConfiguredDefaultPathwayDeadlineDays
} from "./learningPathwayAssignmentService";
import {
  buildRecommendationExplanation,
  buildSupportMaterials,
  calculateWeightedScore,
  classifyPerformance,
  detectTrend,
  generateRecommendationTypes
  ,
  identifyFocusAreas
} from "./recommendationService";
import { getEmployeeIdByUserId } from "./employeeService";

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
    details?: EvaluationDetailInput[];
  },
  evaluator: AuthenticatedUser
) {
  const input = validateEvaluationSubmissionInput(rawInput);
  const employee = await findEmployeeById(input.employeeId);

  if (!employee) {
    throw new ApiError(404, "Selected employee was not found.");
  }

  const kpiIds = input.details.map((detail) => detail.kpiId);
  const matchedKpis = await findKpisByIds(kpiIds);
  const allKpis = await listKpisFromRepository();
  const totalAvailableWeight = await getTotalKpiWeight();

  if (matchedKpis.length !== input.details.length || matchedKpis.length !== allKpis.length) {
    throw new ApiError(400, "Evaluations must include each configured KPI exactly once.");
  }

  const submittedWeight = matchedKpis.reduce(
    (sum, kpi) => sum + Number(kpi.weightPercentage),
    0
  );

  if (Number(submittedWeight.toFixed(2)) !== Number(totalAvailableWeight.toFixed(2))) {
    throw new ApiError(400, "Submitted KPI weights do not match the configured total.");
  }

  const totalScore = calculateWeightedScore(input.details, matchedKpis);
  const performanceLevel = classifyPerformance(totalScore);
  const previousScores = await listPreviousScores(input.employeeId);
  const trend = detectTrend(previousScores, totalScore);
  const recommendationTypes = generateRecommendationTypes(totalScore, previousScores);
  const focusAreas = identifyFocusAreas(input.details, matchedKpis);
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
      trend
    });

    await insertEvaluationDetails(connection, nextEvaluationId, input.details);
    await insertRecommendations(connection, {
      employeeId: input.employeeId,
      evaluationId: nextEvaluationId,
      types: recommendationTypes,
      explanation
    });

    for (const material of materials) {
      await upsertLearningPathwayAssignment(connection, {
        employeeId: input.employeeId,
        resourceId: material.resourceId,
        sourceEvaluationId: nextEvaluationId,
        assignedBy: evaluator.id,
        dueDate: calculateSuggestedDueDate(material, defaultDeadlineDays)
      });
    }

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

    return nextEvaluationId;
  });

  return {
    evaluationId,
    employeeId: input.employeeId,
    totalScore,
    performanceLevel,
    trend,
    recommendationTypes,
    explanation,
    focusAreas,
    materials: materials.map((material) => ({
      ...material,
      completedModuleIndexes: []
    }))
  };
}
