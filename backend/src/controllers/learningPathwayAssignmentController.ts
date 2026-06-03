import type { Request, Response } from "express";

import {
  getLearningPathwayAssignment,
  updateLearningPathwayAssignmentDecision
} from "../services/learningPathwayAssignmentService";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const getLearningPathwayAssignmentController = asyncHandler(async (
  request: Request,
  response: Response
) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  response.json(
    await getLearningPathwayAssignment(request.user, {
      employeeId:
        typeof request.query.employeeId === "string" && request.query.employeeId
          ? Number(request.query.employeeId)
          : undefined,
      resourceId: typeof request.query.resourceId === "string" ? request.query.resourceId : undefined
    })
  );
});

export const updateLearningPathwayAssignmentController = asyncHandler(async (
  request: Request,
  response: Response
) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  response.json(
    await updateLearningPathwayAssignmentDecision(request.user, Number(request.params.assignmentId), {
      dueDate: typeof request.body.dueDate === "string" ? request.body.dueDate : undefined,
      completionDecision: request.body.completionDecision,
      decisionComment: typeof request.body.decisionComment === "string" ? request.body.decisionComment : undefined
    })
  );
});
