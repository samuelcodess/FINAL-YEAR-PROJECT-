import type { Request, Response } from "express";

import { findEmployeeByUserId } from "../repositories/employeeRepository";
import { listRecommendationsWithMaterials } from "../services/recommendationService";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const listRecommendationsController = asyncHandler(async (
  request: Request,
  response: Response
) => {
  const user = request.user;

  if (!user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const employee = user.role === "employee" ? await findEmployeeByUserId(user.id) : null;

  response.json(
    await listRecommendationsWithMaterials({
      role: user.role,
      employeeId: employee?.id ?? null
    })
  );
});
