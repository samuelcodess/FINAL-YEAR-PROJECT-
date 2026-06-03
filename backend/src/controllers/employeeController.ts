import type { Request, Response } from "express";

import {
  createEmployee,
  deleteEmployee,
  getEmployeeProfile,
  listEmployees,
  updateEmployee
} from "../services/employeeService";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const listEmployeesController = asyncHandler(async (request: Request, response: Response) => {
  response.json(
    await listEmployees({
      q: typeof request.query.q === "string" ? request.query.q : undefined,
      status: typeof request.query.status === "string" ? request.query.status : undefined,
      departmentId:
        typeof request.query.departmentId === "string" && request.query.departmentId
          ? Number(request.query.departmentId)
          : undefined,
      page: Number(request.query.page ?? 1),
      pageSize: Number(request.query.pageSize ?? 10)
    })
  );
});

export const getEmployeeController = asyncHandler(async (request: Request, response: Response) => {
  const employeeId = Number(request.params.employeeId);
  const requester = request.user;

  if (!requester) {
    throw new ApiError(401, "Authentication is required.");
  }

  const employee = await getEmployeeProfile(employeeId, requester);

  if (!employee) {
    throw new ApiError(404, "Employee not found.");
  }

  response.json(employee);
});

export const createEmployeeController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const employee = await createEmployee(request.body, request.user);
  response.status(201).json(employee);
});

export const updateEmployeeController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const employeeId = Number(request.params.employeeId);
  const employee = await updateEmployee(employeeId, request.body, request.user);
  response.json(employee);
});

export const deleteEmployeeController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const employeeId = Number(request.params.employeeId);
  await deleteEmployee(employeeId, request.user);
  response.status(204).send();
});
