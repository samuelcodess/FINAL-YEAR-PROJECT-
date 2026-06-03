import type { Request, Response } from "express";

import {
  createTaskForEmployee,
  getTaskForActor,
  listTasksForActor,
  reviewTaskSubmissionForManager,
  submitTaskWork,
  updateTaskForManager,
  updateTaskProgressForEmployee
} from "../services/taskService";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const listTasksController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  response.json(
    await listTasksForActor(request.user, {
      q: typeof request.query.q === "string" ? request.query.q : undefined,
      status: typeof request.query.status === "string" ? request.query.status : undefined,
      scope: typeof request.query.scope === "string" ? request.query.scope : undefined,
      page: Number(request.query.page ?? 1),
      pageSize: Number(request.query.pageSize ?? 10)
    })
  );
});

export const getTaskController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const taskId = Number(request.params.taskId);
  const task = await getTaskForActor(taskId, request.user);

  if (!task) {
    throw new ApiError(404, "Task not found.");
  }

  response.json(task);
});

export const createTaskController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const task = await createTaskForEmployee(request.user, request.body);
  response.status(201).json(task);
});

export const updateTaskController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const taskId = Number(request.params.taskId);
  response.json(await updateTaskForManager(request.user, taskId, request.body));
});

export const updateTaskProgressController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const taskId = Number(request.params.taskId);
  response.json(await updateTaskProgressForEmployee(request.user, taskId, request.body));
});

export const submitTaskWorkController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const taskId = Number(request.params.taskId);
  response.json(await submitTaskWork(request.user, taskId, request.body));
});

export const reviewTaskSubmissionController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const taskId = Number(request.params.taskId);
  const submissionId = Number(request.params.submissionId);
  response.json(await reviewTaskSubmissionForManager(request.user, taskId, submissionId, request.body));
});
