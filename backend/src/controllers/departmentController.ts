import type { Request, Response } from "express";

import {
  createDepartmentRecord,
  deleteDepartmentRecord,
  getDepartments,
  updateDepartmentRecord
} from "../services/departmentService";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const listDepartmentsController = asyncHandler(async (_request: Request, response: Response) => {
  response.json(await getDepartments());
});

export const createDepartmentController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const { departmentName } = request.body as { departmentName?: string };
  response.status(201).json(await createDepartmentRecord(departmentName ?? "", request.user));
});

export const updateDepartmentController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const departmentId = Number(request.params.departmentId);
  const { departmentName } = request.body as { departmentName?: string };
  response.json(await updateDepartmentRecord(departmentId, departmentName ?? "", request.user));
});

export const deleteDepartmentController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const departmentId = Number(request.params.departmentId);
  await deleteDepartmentRecord(departmentId, request.user);
  response.status(204).send();
});
