import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

import { pool } from "../database/pool";
import type { TaskSubmissionStatus } from "../types/domain";

export type TaskSubmissionRow = {
  id: number;
  taskId: number;
  employeeId: number;
  employeeName: string;
  submissionNote: string;
  status: TaskSubmissionStatus;
  reviewComment: string | null;
  reviewedBy: number | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listTaskSubmissions(taskId: number) {
  const [rows] = await pool.query(
    `SELECT
       s.id,
       s.task_id AS taskId,
       s.employee_id AS employeeId,
       employee_user.full_name AS employeeName,
       s.submission_note AS submissionNote,
       s.status,
       s.review_comment AS reviewComment,
       s.reviewed_by AS reviewedBy,
       reviewer.full_name AS reviewedByName,
       DATE_FORMAT(s.reviewed_at, '%Y-%m-%d %H:%i:%s') AS reviewedAt,
       DATE_FORMAT(s.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
       DATE_FORMAT(s.updated_at, '%Y-%m-%d %H:%i:%s') AS updatedAt
     FROM task_submissions s
     INNER JOIN employees e ON e.id = s.employee_id
     INNER JOIN users employee_user ON employee_user.id = e.user_id
     LEFT JOIN users reviewer ON reviewer.id = s.reviewed_by
     WHERE s.task_id = ?
     ORDER BY s.created_at DESC, s.id DESC`,
    [taskId]
  );

  return rows as TaskSubmissionRow[];
}

export async function listTaskSubmissionsForTaskIds(taskIds: number[]) {
  if (taskIds.length === 0) {
    return [] as TaskSubmissionRow[];
  }

  const placeholders = taskIds.map(() => "?").join(", ");
  const [rows] = await pool.query(
    `SELECT
       s.id,
       s.task_id AS taskId,
       s.employee_id AS employeeId,
       employee_user.full_name AS employeeName,
       s.submission_note AS submissionNote,
       s.status,
       s.review_comment AS reviewComment,
       s.reviewed_by AS reviewedBy,
       reviewer.full_name AS reviewedByName,
       DATE_FORMAT(s.reviewed_at, '%Y-%m-%d %H:%i:%s') AS reviewedAt,
       DATE_FORMAT(s.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
       DATE_FORMAT(s.updated_at, '%Y-%m-%d %H:%i:%s') AS updatedAt
     FROM task_submissions s
     INNER JOIN employees e ON e.id = s.employee_id
     INNER JOIN users employee_user ON employee_user.id = e.user_id
     LEFT JOIN users reviewer ON reviewer.id = s.reviewed_by
     WHERE s.task_id IN (${placeholders})
     ORDER BY s.created_at DESC, s.id DESC`,
    taskIds
  );

  return rows as TaskSubmissionRow[];
}

export async function createTaskSubmission(
  connection: PoolConnection,
  input: {
    taskId: number;
    employeeId: number;
    submissionNote: string;
  }
) {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO task_submissions (
       task_id,
       employee_id,
       submission_note,
       status
     ) VALUES (?, ?, ?, 'submitted')`,
    [input.taskId, input.employeeId, input.submissionNote]
  );

  return result.insertId;
}

export async function findTaskSubmissionById(submissionId: number) {
  const [rows] = await pool.query(
    `SELECT
       s.id,
       s.task_id AS taskId,
       s.employee_id AS employeeId,
       employee_user.full_name AS employeeName,
       s.submission_note AS submissionNote,
       s.status,
       s.review_comment AS reviewComment,
       s.reviewed_by AS reviewedBy,
       reviewer.full_name AS reviewedByName,
       DATE_FORMAT(s.reviewed_at, '%Y-%m-%d %H:%i:%s') AS reviewedAt,
       DATE_FORMAT(s.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
       DATE_FORMAT(s.updated_at, '%Y-%m-%d %H:%i:%s') AS updatedAt
     FROM task_submissions s
     INNER JOIN employees e ON e.id = s.employee_id
     INNER JOIN users employee_user ON employee_user.id = e.user_id
     LEFT JOIN users reviewer ON reviewer.id = s.reviewed_by
     WHERE s.id = ?`,
    [submissionId]
  );

  return (rows as TaskSubmissionRow[])[0] ?? null;
}

export async function updateTaskSubmissionReview(
  connection: PoolConnection,
  input: {
    submissionId: number;
    status: TaskSubmissionStatus;
    reviewComment: string;
    reviewedBy: number;
  }
) {
  await connection.execute(
    `UPDATE task_submissions
     SET status = ?, review_comment = ?, reviewed_by = ?, reviewed_at = NOW()
     WHERE id = ?`,
    [input.status, input.reviewComment, input.reviewedBy, input.submissionId]
  );
}
