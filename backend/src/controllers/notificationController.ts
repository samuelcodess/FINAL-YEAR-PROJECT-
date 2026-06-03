import type { Request, Response } from "express";

import { listNotificationsForUser } from "../repositories/notificationRepository";
import {
  getNotificationUnreadSummary,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  markNotificationCategoryAsRead
} from "../services/notificationService";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const listNotificationsController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  response.json(await listNotificationsForUser(request.user.id));
});

export const notificationSummaryController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  response.json(await getNotificationUnreadSummary(request.user.id));
});

export const markNotificationReadController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const notificationId = Number(request.params.notificationId);
  await markNotificationAsRead(request.user.id, notificationId);
  response.json({
    message: "Notification marked as read."
  });
});

export const markAllNotificationsReadController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  await markAllNotificationsAsRead(request.user.id);
  response.json({
    message: "All notifications marked as read."
  });
});

export const markNotificationCategoryReadController = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication is required.");
  }

  const category = request.params.category;

  if (
    category !== "general" &&
    category !== "task" &&
    category !== "recommendation" &&
    category !== "evaluation" &&
    category !== "security"
  ) {
    throw new ApiError(400, "Invalid notification category.");
  }

  await markNotificationCategoryAsRead(request.user.id, category);
  response.json({
    message: `Notifications in category ${category} marked as read.`
  });
});
