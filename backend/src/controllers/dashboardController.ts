import type { Request, Response } from "express";

import { getAdminDashboard, getEmployeeDashboard, getHrDashboard } from "../services/dashboardService";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const adminDashboardController = asyncHandler(async (_request: Request, response: Response) => {
  response.json(await getAdminDashboard());
});

export const hrDashboardController = asyncHandler(async (request: Request, response: Response) => {
  response.json(await getHrDashboard(request.user!.id));
});

export const employeeDashboardController = asyncHandler(async (request: Request, response: Response) => {
  const user = request.user;

  if (!user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const dashboard = await getEmployeeDashboard(user.id);

  if (!dashboard) {
    throw new ApiError(404, "No employee dashboard found for the signed-in user.");
  }

  response.json(dashboard);
});
