import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

import { pool } from "../database/pool";
import type { TaskSubmissionAiRecommendation, TaskSubmissionStatus } from "../types/domain";

export type TaskSubmissionRow = {
  id: number;
  taskId: number;
  employeeId: number;
  employeeName: string;
  submissionNote: string;
  aiReviewAvailable: boolean;
  aiScore: number;
  aiFeedback: string;
  aiStrengths: string;
  aiImprovements: string;
  aiRecommendation: TaskSubmissionAiRecommendation;
  status: TaskSubmissionStatus;
  reviewComment: string | null;
  reviewedBy: number | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function isMissingAiTaskSubmissionColumnError(error: unknown) {
  const databaseError = error as { code?: string };
  return databaseError?.code === "ER_BAD_FIELD_ERROR";
}

function withLegacyAiDefaults(
  rows: Array<
    Omit<
      TaskSubmissionRow,
      "aiReviewAvailable" | "aiScore" | "aiFeedback" | "aiStrengths" | "aiImprovements" | "aiRecommendation"
    >
  >
) {
  return rows.map((row) => ({
    ...row,
    aiReviewAvailable: false,
    aiScore: 0,
    aiFeedback: "",
    aiStrengths: "",
    aiImprovements: "",
    aiRecommendation: "needs_revision" as TaskSubmissionAiRecommendation
  }));
}

export async function listTaskSubmissions(taskId: number) {
  try {
    const [rows] = await pool.query(
      `SELECT
         s.id,
         s.task_id AS taskId,
         s.employee_id AS employeeId,
         employee_user.full_name AS employeeName,
         s.submission_note AS submissionNote,
         TRUE AS aiReviewAvailable,
         s.ai_score AS aiScore,
         s.ai_feedback AS aiFeedback,
         s.ai_strengths AS aiStrengths,
         s.ai_improvements AS aiImprovements,
         s.ai_recommendation AS aiRecommendation,
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
  } catch (error) {
    if (!isMissingAiTaskSubmissionColumnError(error)) {
      throw error;
    }

    const [legacyRows] = await pool.query(
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

    return withLegacyAiDefaults(
      legacyRows as Array<
        Omit<
          TaskSubmissionRow,
          "aiReviewAvailable" | "aiScore" | "aiFeedback" | "aiStrengths" | "aiImprovements" | "aiRecommendation"
        >
      >
    );
  }
}

export async function listTaskSubmissionsForTaskIds(taskIds: number[]) {
  if (taskIds.length === 0) {
    return [] as TaskSubmissionRow[];
  }

  const placeholders = taskIds.map(() => "?").join(", ");
  try {
    const [rows] = await pool.query(
      `SELECT
         s.id,
         s.task_id AS taskId,
         s.employee_id AS employeeId,
         employee_user.full_name AS employeeName,
         s.submission_note AS submissionNote,
         TRUE AS aiReviewAvailable,
         s.ai_score AS aiScore,
         s.ai_feedback AS aiFeedback,
         s.ai_strengths AS aiStrengths,
         s.ai_improvements AS aiImprovements,
         s.ai_recommendation AS aiRecommendation,
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
  } catch (error) {
    if (!isMissingAiTaskSubmissionColumnError(error)) {
      throw error;
    }

    const [legacyRows] = await pool.query(
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

    return withLegacyAiDefaults(
      legacyRows as Array<
        Omit<
          TaskSubmissionRow,
          "aiReviewAvailable" | "aiScore" | "aiFeedback" | "aiStrengths" | "aiImprovements" | "aiRecommendation"
        >
      >
    );
  }
}

export async function createTaskSubmission(
  connection: PoolConnection,
  input: {
    taskId: number;
    employeeId: number;
    submissionNote: string;
    aiScore: number;
    aiFeedback: string;
    aiStrengths: string;
    aiImprovements: string;
    aiRecommendation: TaskSubmissionAiRecommendation;
  }
) {
  try {
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO task_submissions (
         task_id,
         employee_id,
         submission_note,
         ai_score,
         ai_feedback,
         ai_strengths,
         ai_improvements,
         ai_recommendation,
         status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
      [
        input.taskId,
        input.employeeId,
        input.submissionNote,
        input.aiScore,
        input.aiFeedback,
        input.aiStrengths,
        input.aiImprovements,
        input.aiRecommendation
      ]
    );

    return result.insertId;
  } catch (error) {
    if (!isMissingAiTaskSubmissionColumnError(error)) {
      throw error;
    }

    const [legacyResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO task_submissions (
         task_id,
         employee_id,
         submission_note,
         status
       ) VALUES (?, ?, ?, 'submitted')`,
      [input.taskId, input.employeeId, input.submissionNote]
    );

    return legacyResult.insertId;
  }
}

export async function findTaskSubmissionById(submissionId: number) {
  try {
    const [rows] = await pool.query(
      `SELECT
         s.id,
         s.task_id AS taskId,
         s.employee_id AS employeeId,
         employee_user.full_name AS employeeName,
         s.submission_note AS submissionNote,
         TRUE AS aiReviewAvailable,
         s.ai_score AS aiScore,
         s.ai_feedback AS aiFeedback,
         s.ai_strengths AS aiStrengths,
         s.ai_improvements AS aiImprovements,
         s.ai_recommendation AS aiRecommendation,
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
  } catch (error) {
    if (!isMissingAiTaskSubmissionColumnError(error)) {
      throw error;
    }

    const [legacyRows] = await pool.query(
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

    return (
      withLegacyAiDefaults(
        legacyRows as Array<
          Omit<
          TaskSubmissionRow,
            "aiReviewAvailable" | "aiScore" | "aiFeedback" | "aiStrengths" | "aiImprovements" | "aiRecommendation"
          >
        >
      )[0] ?? null
    );
  }
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
