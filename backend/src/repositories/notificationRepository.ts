import type { PoolConnection } from "mysql2/promise";

import { pool } from "../database/pool";

export type NotificationCategory = "general" | "task" | "recommendation" | "evaluation" | "security";

export async function listNotificationsForUser(userId: number) {
  const [rows] = await pool.query(
    `SELECT
       id,
       user_id AS userId,
       category,
       title,
       message,
       is_read AS isRead,
       created_at AS createdAt
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );

  return rows;
}

export async function markNotificationRead(userId: number, notificationId: number) {
  const [result] = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );

  return result;
}

export async function markAllNotificationsRead(userId: number) {
  const [result] = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = ? AND is_read = FALSE`,
    [userId]
  );

  return result;
}

export async function markNotificationsReadByCategory(userId: number, category: NotificationCategory) {
  const [result] = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = ? AND category = ? AND is_read = FALSE`,
    [userId, category]
  );

  return result;
}

export async function getUnreadNotificationSummary(userId: number) {
  const [rows] = await pool.query(
    `SELECT category, COUNT(*) AS total
     FROM notifications
     WHERE user_id = ? AND is_read = FALSE
     GROUP BY category`,
    [userId]
  );

  const summary = {
    total: 0,
    general: 0,
    task: 0,
    recommendation: 0,
    evaluation: 0,
    security: 0
  };

  for (const row of rows as Array<{ category: NotificationCategory; total: number }>) {
    summary[row.category] = Number(row.total);
    summary.total += Number(row.total);
  }

  return summary;
}

export async function createNotification(
  connection: PoolConnection,
  input: {
    userId: number;
    category?: NotificationCategory;
    title: string;
    message: string;
  }
) {
  await connection.execute(
    `INSERT INTO notifications (user_id, category, title, message, is_read)
     VALUES (?, ?, ?, ?, FALSE)`,
    [input.userId, input.category ?? "general", input.title, input.message]
  );
}
