import type { Request, Response } from "express";

import { listEvaluations, createEvaluation } from "../services/evaluationService";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const listEvaluationsController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  response.json(await listEvaluations(request.user));
});

export const createEvaluationController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const result = await createEvaluation(request.body, request.user);
  response.status(201).json(result);
});
