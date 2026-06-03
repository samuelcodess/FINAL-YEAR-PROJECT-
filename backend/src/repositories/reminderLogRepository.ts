import type { PoolConnection } from "mysql2/promise";

import { pool } from "../database/pool";

export async function hasReminderBeenSent(input: {
  assignmentId: number;
  reminderType: "due_soon" | "overdue";
  reminderDate: string;
}) {
  const [rows] = await pool.query(
    `SELECT id
     FROM learning_pathway_reminder_logs
     WHERE assignment_id = ? AND reminder_type = ? AND reminder_date = ?
     LIMIT 1`,
    [input.assignmentId, input.reminderType, input.reminderDate]
  );

  return (rows as Array<{ id: number }>).length > 0;
}

export async function createReminderLog(
  connection: PoolConnection,
  input: {
    assignmentId: number;
    reminderType: "due_soon" | "overdue";
    reminderDate: string;
  }
) {
  await connection.execute(
    `INSERT INTO learning_pathway_reminder_logs (
       assignment_id,
       reminder_type,
       reminder_date
     ) VALUES (?, ?, ?)`,
    [input.assignmentId, input.reminderType, input.reminderDate]
  );
}
