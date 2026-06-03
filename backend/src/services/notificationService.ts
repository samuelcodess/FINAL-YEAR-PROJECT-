import {
  getUnreadNotificationSummary,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationsReadByCategory,
  type NotificationCategory
} from "../repositories/notificationRepository";
import { ApiError } from "../utils/ApiError";

export async function markNotificationAsRead(userId: number, notificationId: number) {
  const result = await markNotificationRead(userId, notificationId) as {
    affectedRows?: number;
  };

  if (!result.affectedRows) {
    throw new ApiError(404, "Notification not found.");
  }
}

export async function markAllNotificationsAsRead(userId: number) {
  await markAllNotificationsRead(userId);
}

export async function markNotificationCategoryAsRead(userId: number, category: NotificationCategory) {
  await markNotificationsReadByCategory(userId, category);
}

export async function getNotificationUnreadSummary(userId: number) {
  return getUnreadNotificationSummary(userId);
}
