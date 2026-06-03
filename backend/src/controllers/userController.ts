import type { Request, Response } from "express";

import {
  changeUserRole,
  createPlatformUser,
  deleteUserAccount,
  listUsers,
  resetUserPassword,
  updateOwnProfile
} from "../services/userService";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const listUsersController = asyncHandler(async (request: Request, response: Response) => {
  response.json(
    await listUsers({
      page: Number(request.query.page ?? 1),
      pageSize: Number(request.query.pageSize ?? 10),
      q: typeof request.query.q === "string" ? request.query.q : undefined,
      role: typeof request.query.role === "string" ? (request.query.role as never) : ""
    })
  );
});

export const createUserController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  response.status(201).json(await createPlatformUser(request.body, request.user));
});

export const updateUserRoleController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const userId = Number(request.params.userId);
  const { role } = request.body as { role?: "admin" | "hr_manager" | "employee" };
  const user = await changeUserRole(userId, role ?? "employee", request.user);
  response.json(user);
});

export const deleteUserController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const userId = Number(request.params.userId);
  await deleteUserAccount(userId, request.user);
  response.status(204).send();
});

export const resetUserPasswordController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const userId = Number(request.params.userId);
  response.json(await resetUserPassword(userId, request.user));
});

export const updateOwnProfileController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  response.json(await updateOwnProfile(request.user, request.body));
});
