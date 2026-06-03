import type { Request, Response } from "express";

import {
  getLearningPathwaySubmissionsForPathway,
  reviewLearningPathwaySubmission,
  submitLearningPathwayEvidence
} from "../services/learningPathwaySubmissionService";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const listLearningPathwaySubmissionsController = asyncHandler(async (
  request: Request,
  response: Response
) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  response.json(
    await getLearningPathwaySubmissionsForPathway(request.user, {
      employeeId:
        typeof request.query.employeeId === "string" && request.query.employeeId
          ? Number(request.query.employeeId)
          : undefined,
      resourceId: typeof request.query.resourceId === "string" ? request.query.resourceId : undefined
    })
  );
});

export const createLearningPathwaySubmissionController = asyncHandler(async (
  request: Request,
  response: Response
) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  response.status(201).json(
    await submitLearningPathwayEvidence(request.user, request.body as {
      employeeId?: number;
      resourceId?: string;
      submissionType?: "module" | "final_assignment";
      moduleIndex?: number | null;
      submissionText?: string;
    })
  );
});

export const reviewLearningPathwaySubmissionController = asyncHandler(async (
  request: Request,
  response: Response
) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const submissionId = Number(request.params.submissionId);

  response.json(
    await reviewLearningPathwaySubmission(request.user, submissionId, request.body as {
      status?: "submitted" | "approved" | "needs_revision";
      reviewComment?: string;
    })
  );
});
