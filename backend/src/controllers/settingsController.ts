import type { Request, Response } from "express";

import {
  getSettingsForUser,
  updateOwnPreferences,
  updateSystemSettings
} from "../services/settingsService";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const getSettingsController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  response.json(await getSettingsForUser(request.user));
});

export const updateOwnPreferencesController = asyncHandler(async (
  request: Request,
  response: Response
) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  response.json(await updateOwnPreferences(request.user, request.body));
});

export const updateSystemSettingsController = asyncHandler(async (
  request: Request,
  response: Response
) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  response.json(await updateSystemSettings(request.user, request.body));
});
