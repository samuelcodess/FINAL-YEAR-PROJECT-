import type { Request, Response } from "express";

import { changePassword, initiatePasswordReset, login, register, resetPassword } from "../services/authService";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const loginController = asyncHandler(async (request: Request, response: Response) => {
  const { email, password } = request.body as { email?: string; password?: string };

  if (!email || !password) {
    response.status(400).json({
      message: "Email and password are required."
    });
    return;
  }

  const payload = await login(email, password);
  response.json(payload);
});

export const meController = asyncHandler(async (request: Request, response: Response) => {
  response.json({
    user: request.user ?? null
  });
});

export const registerController = asyncHandler(async (request: Request, response: Response) => {
  response.status(201).json(await register(request.body));
});

export const forgotPasswordController = asyncHandler(async (request: Request, response: Response) => {
  const { email } = request.body as { email?: string };

  if (!email) {
    response.status(400).json({
      message: "Email is required."
    });
    return;
  }

  response.json(await initiatePasswordReset(email));
});

export const resetPasswordController = asyncHandler(async (request: Request, response: Response) => {
  response.json(await resetPassword(request.body));
});

export const changePasswordController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  response.json(await changePassword(request.user, request.body));
});
