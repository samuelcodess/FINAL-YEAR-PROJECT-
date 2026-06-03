import type { Request, Response } from "express";

import {
  getLearningPathwayProgress,
  updateLearningPathwayProgress
} from "../services/learningPathwayProgressService";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const getLearningPathwayProgressController = asyncHandler(async (
  request: Request,
  response: Response
) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  response.json(
    await getLearningPathwayProgress(request.user, {
      employeeId:
        typeof request.query.employeeId === "string" && request.query.employeeId
          ? Number(request.query.employeeId)
          : undefined,
      resourceId: typeof request.query.resourceId === "string" ? request.query.resourceId : undefined
    })
  );
});

export const updateLearningPathwayProgressController = asyncHandler(async (
  request: Request,
  response: Response
) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const { employeeId, resourceId, moduleIndex, completed } = request.body as {
    employeeId?: number;
    resourceId?: string;
    moduleIndex?: number;
    completed?: boolean;
  };

  response.json(
    await updateLearningPathwayProgress(request.user, {
      employeeId,
      resourceId,
      moduleIndex,
      completed
    })
  );
});
