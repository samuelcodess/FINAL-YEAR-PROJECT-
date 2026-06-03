import { withTransaction } from "../database/transaction";
import { createActivityLog } from "../repositories/activityLogRepository";
import { findEmployeeById, findEmployeeByUserId } from "../repositories/employeeRepository";
import {
  listLearningPathwayProgress,
  markLearningPathwayModuleComplete,
  removeLearningPathwayModuleCompletion
} from "../repositories/learningPathwayProgressRepository";
import type { AuthenticatedUser } from "../types/domain";
import { ApiError } from "../utils/ApiError";

async function resolveEmployeeIdForProgress(actor: AuthenticatedUser, requestedEmployeeId?: number) {
  if (actor.role === "employee") {
    const employee = await findEmployeeByUserId(actor.id);

    if (!employee) {
      throw new ApiError(404, "Employee profile not found for the signed-in user.");
    }

    if (requestedEmployeeId && requestedEmployeeId !== employee.id) {
      throw new ApiError(403, "Employees can only manage their own learning progress.");
    }

    return employee.id;
  }

  const employeeId = Number(requestedEmployeeId);

  if (!employeeId) {
    throw new ApiError(400, "Employee selection is required.");
  }

  const employee = await findEmployeeById(employeeId);

  if (!employee) {
    throw new ApiError(404, "Employee not found.");
  }

  return employee.id;
}

export async function getLearningPathwayProgress(
  actor: AuthenticatedUser,
  input: {
    employeeId?: number;
    resourceId?: string;
  }
) {
  const resourceId = input.resourceId?.trim() ?? "";

  if (!resourceId) {
    throw new ApiError(400, "Resource ID is required.");
  }

  const employeeId = await resolveEmployeeIdForProgress(actor, input.employeeId);
  const rows = await listLearningPathwayProgress({
    employeeIds: [employeeId],
    resourceIds: [resourceId]
  });

  return {
    employeeId,
    resourceId,
    completedModuleIndexes: rows.map((row) => Number(row.moduleIndex))
  };
}

export async function updateLearningPathwayProgress(
  actor: AuthenticatedUser,
  input: {
    employeeId?: number;
    resourceId?: string;
    moduleIndex?: number;
    completed?: boolean;
  }
) {
  if (actor.role === "admin") {
    throw new ApiError(403, "Administrators can view progress but cannot mark modules complete.");
  }

  const resourceId = input.resourceId?.trim() ?? "";
  const moduleIndex = Number(input.moduleIndex);
  const completed = Boolean(input.completed);

  if (!resourceId) {
    throw new ApiError(400, "Resource ID is required.");
  }

  if (!Number.isInteger(moduleIndex) || moduleIndex < 0) {
    throw new ApiError(400, "A valid module index is required.");
  }

  const employeeId = await resolveEmployeeIdForProgress(actor, input.employeeId);

  await withTransaction(async (connection) => {
    if (completed) {
      await markLearningPathwayModuleComplete(connection, {
        employeeId,
        resourceId,
        moduleIndex
      });
    } else {
      await removeLearningPathwayModuleCompletion(connection, {
        employeeId,
        resourceId,
        moduleIndex
      });
    }

    await createActivityLog(connection, {
      userId: actor.id,
      action: `${completed ? "Marked" : "Unmarked"} learning pathway module ${moduleIndex + 1} for employee ${employeeId} in ${resourceId}.`
    });
  });

  return getLearningPathwayProgress(actor, {
    employeeId,
    resourceId
  });
}
