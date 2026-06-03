import { withTransaction } from "../database/transaction";
import { createActivityLog } from "../repositories/activityLogRepository";
import { findEmployeeById, findEmployeeByUserId } from "../repositories/employeeRepository";
import {
  findLearningPathwayAssignmentByEmployeeAndResource,
  findLearningPathwayAssignmentById,
  listAllLearningPathwayAssignments,
  listLearningPathwayAssignments,
  upsertLearningPathwayAssignment,
  updateLearningPathwayAssignment
} from "../repositories/learningPathwayAssignmentRepository";
import { getNumberSystemSetting } from "./settingsService";
import { listLearningPathwaySubmissions } from "../repositories/learningPathwaySubmissionRepository";
import type { AuthenticatedUser, LearningMaterial, LearningPathwayCompletionDecision } from "../types/domain";
import { ApiError } from "../utils/ApiError";

function normalizeText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function calculateSuggestedDueDate(
  material: Pick<LearningMaterial, "estimatedDuration">,
  defaultDeadlineDays?: number | null
) {
  if (defaultDeadlineDays && Number.isInteger(defaultDeadlineDays) && defaultDeadlineDays > 0) {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + defaultDeadlineDays);
    return formatDateOnly(dueDate);
  }

  const lowerDuration = material.estimatedDuration.toLowerCase();
  const today = new Date();
  const dueDate = new Date(today);

  if (lowerDuration.includes("weekly") || lowerDuration.includes("plus practice")) {
    dueDate.setDate(dueDate.getDate() + 28);
  } else if (lowerDuration.includes("2-3 hours") || lowerDuration.includes("1-2 hours")) {
    dueDate.setDate(dueDate.getDate() + 21);
  } else {
    dueDate.setDate(dueDate.getDate() + 14);
  }

  return formatDateOnly(dueDate);
}

export async function getConfiguredDefaultPathwayDeadlineDays() {
  return getNumberSystemSetting("default_pathway_deadline_days", 21);
}

async function resolveEmployeeForAssignment(actor: AuthenticatedUser, employeeId?: number) {
  if (actor.role === "employee") {
    const employee = await findEmployeeByUserId(actor.id);

    if (!employee) {
      throw new ApiError(404, "Employee profile not found for the signed-in user.");
    }

    if (employeeId && employeeId !== employee.id) {
      throw new ApiError(403, "Employees can only view their own learning pathways.");
    }

    return employee;
  }

  const requestedId = Number(employeeId);

  if (!requestedId) {
    throw new ApiError(400, "Employee selection is required.");
  }

  const employee = await findEmployeeById(requestedId);

  if (!employee) {
    throw new ApiError(404, "Employee not found.");
  }

  return employee;
}

export async function ensureLearningPathwayAssignments(input: Array<{
  employeeId: number;
  resourceId: string;
  sourceEvaluationId?: number | null;
  assignedBy?: number | null;
  dueDate?: string | null;
}>) {
  if (input.length === 0) {
    return;
  }

  await withTransaction(async (connection) => {
    for (const item of input) {
      await upsertLearningPathwayAssignment(connection, item);
    }
  });
}

export async function getLearningPathwayAssignment(
  actor: AuthenticatedUser,
  input: {
    employeeId?: number;
    resourceId?: string;
  }
) {
  const resourceId = normalizeText(input.resourceId);

  if (!resourceId) {
    throw new ApiError(400, "Resource ID is required.");
  }

  const employee = await resolveEmployeeForAssignment(actor, input.employeeId);
  const assignment = await findLearningPathwayAssignmentByEmployeeAndResource({
    employeeId: employee.id,
    resourceId
  });

  return {
    employeeId: employee.id,
    resourceId,
    assignment
  };
}

export async function updateLearningPathwayAssignmentDecision(
  actor: AuthenticatedUser,
  assignmentId: number,
  input: {
    dueDate?: string | null;
    completionDecision?: LearningPathwayCompletionDecision;
    decisionComment?: string | null;
  }
) {
  if (actor.role !== "hr_manager") {
    throw new ApiError(403, "Only HR managers can update pathway deadlines and completion decisions.");
  }

  const assignment = await findLearningPathwayAssignmentById(assignmentId);

  if (!assignment) {
    throw new ApiError(404, "Learning pathway assignment not found.");
  }

  const dueDate = input.dueDate?.trim() ? input.dueDate.trim() : assignment.dueDate;
  const completionDecision = input.completionDecision ?? assignment.completionDecision;
  const decisionComment = normalizeText(input.decisionComment) || assignment.decisionComment;
  const shouldStampDecisionAt =
    completionDecision !== assignment.completionDecision ||
    decisionComment !== assignment.decisionComment;

  if (completionDecision !== "in_progress") {
    const submissions = await listLearningPathwaySubmissions({
      employeeId: assignment.employeeId,
      resourceId: assignment.resourceId
    });
    const latestFinalAssignment = submissions.find((item) => item.submissionType === "final_assignment") ?? null;

    if (!latestFinalAssignment || latestFinalAssignment.status !== "approved") {
      throw new ApiError(
        400,
        "A final assignment must be approved before the pathway can be marked as completed or follow-up required."
      );
    }
  }

  await withTransaction(async (connection) => {
    await updateLearningPathwayAssignment(connection, {
      assignmentId,
      dueDate,
      completionDecision,
      decisionComment: decisionComment ?? null,
      decidedBy: shouldStampDecisionAt ? actor.id : assignment.decidedBy,
      completedAt: completionDecision === "completed" ? new Date().toISOString().slice(0, 19).replace("T", " ") : null,
      stampDecisionAt: shouldStampDecisionAt
    });

    await createActivityLog(connection, {
      userId: actor.id,
      action: `Updated learning pathway assignment ${assignmentId} with decision ${completionDecision}.`
    });
  });

  return getLearningPathwayAssignment(actor, {
    employeeId: assignment.employeeId,
    resourceId: assignment.resourceId
  });
}

export async function buildLearningPathwayAnalytics() {
  const assignments = await listAllLearningPathwayAssignments();
  const completedAssignments = assignments.filter((item) => item.completionDecision === "completed");
  const measuredAssignments = completedAssignments.filter((item) => item.improvementDelta !== null);
  const improvedAssignments = measuredAssignments.filter((item) => Number(item.improvementDelta) > 0);
  const declinedAssignments = measuredAssignments.filter((item) => Number(item.improvementDelta) < 0);
  const stableAssignments = measuredAssignments.filter((item) => Number(item.improvementDelta) === 0);
  const pendingMeasurement = completedAssignments.filter((item) => item.followUpScore === null);

  const averageImprovementDelta =
    measuredAssignments.length > 0
      ? Number(
          (
            measuredAssignments.reduce((sum, item) => sum + Number(item.improvementDelta ?? 0), 0) /
            measuredAssignments.length
          ).toFixed(2)
        )
      : 0;

  return {
    summary: {
      totalAssignments: assignments.length,
      completedAssignments: completedAssignments.length,
      followUpRequiredAssignments: assignments.filter((item) => item.completionDecision === "follow_up_required").length,
      improvedAssignments: improvedAssignments.length,
      pendingMeasurement: pendingMeasurement.length,
      averageImprovementDelta
    },
    recentOutcomes: assignments.slice(0, 6).map((item) => ({
      assignmentId: item.id,
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      resourceId: item.resourceId,
      assignedAt: item.assignedAt,
      dueDate: item.dueDate,
      completionDecision: item.completionDecision,
      decisionComment: item.decisionComment,
      improvementDelta: item.improvementDelta,
      baselineScore: item.baselineScore,
      followUpScore: item.followUpScore
    })),
    measurementBreakdown: {
      improved: improvedAssignments.length,
      stable: stableAssignments.length,
      declined: declinedAssignments.length,
      pending: pendingMeasurement.length
    }
  };
}

export async function listAssignmentMetadataForMaterials(input: {
  employeeIds: number[];
  resourceIds: string[];
}) {
  const assignments = await listLearningPathwayAssignments(input);
  const map = new Map<string, (typeof assignments)[number]>();

  for (const assignment of assignments) {
    map.set(`${assignment.employeeId}:${assignment.resourceId}`, assignment);
  }

  return map;
}
