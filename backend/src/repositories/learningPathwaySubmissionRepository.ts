import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

import { pool } from "../database/pool";
import type {
  LearningPathwayAiRecommendation,
  LearningPathwaySubmissionStatus,
  LearningPathwaySubmissionType
} from "../types/domain";

export type LearningPathwaySubmissionRow = {
  id: number;
  employeeId: number;
  employeeName: string;
  resourceId: string;
  submissionType: LearningPathwaySubmissionType;
  moduleIndex: number | null;
  submissionText: string;
  aiScore: number;
  aiFeedback: string;
  aiStrengths: string;
  aiImprovements: string;
  aiRecommendation: LearningPathwayAiRecommendation;
  status: LearningPathwaySubmissionStatus;
  reviewComment: string | null;
  reviewedBy: number | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LearningPathwayLatestSubmissionSummaryRow = {
  employeeId: number;
  resourceId: string;
  aiScore: number;
  aiRecommendation: LearningPathwayAiRecommendation;
  status: LearningPathwaySubmissionStatus;
  updatedAt: string;
};

export async function listLearningPathwaySubmissions(input: {
  employeeId: number;
  resourceId: string;
}) {
  const [rows] = await pool.query(
    `SELECT
       s.id,
       s.employee_id AS employeeId,
       u.full_name AS employeeName,
       s.resource_id AS resourceId,
       s.submission_type AS submissionType,
       s.module_index AS moduleIndex,
       s.submission_text AS submissionText,
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
     FROM learning_pathway_submissions s
     INNER JOIN employees e ON e.id = s.employee_id
     INNER JOIN users u ON u.id = e.user_id
     LEFT JOIN users reviewer ON reviewer.id = s.reviewed_by
     WHERE s.employee_id = ? AND s.resource_id = ?
     ORDER BY s.updated_at DESC, s.id DESC`,
    [input.employeeId, input.resourceId]
  );

  return rows as LearningPathwaySubmissionRow[];
}

export async function listLatestLearningPathwaySubmissionSummaries(input: {
  employeeIds: number[];
  resourceIds: string[];
}) {
  if (input.employeeIds.length === 0 || input.resourceIds.length === 0) {
    return [] as LearningPathwayLatestSubmissionSummaryRow[];
  }

  const employeePlaceholders = input.employeeIds.map(() => "?").join(", ");
  const resourcePlaceholders = input.resourceIds.map(() => "?").join(", ");

  const [rows] = await pool.query(
    `SELECT
       s.employee_id AS employeeId,
       s.resource_id AS resourceId,
       s.ai_score AS aiScore,
       s.ai_recommendation AS aiRecommendation,
       s.status,
       DATE_FORMAT(s.updated_at, '%Y-%m-%d %H:%i:%s') AS updatedAt
     FROM learning_pathway_submissions s
     WHERE s.employee_id IN (${employeePlaceholders})
       AND s.resource_id IN (${resourcePlaceholders})
     ORDER BY s.employee_id ASC, s.resource_id ASC, s.updated_at DESC, s.id DESC`,
    [...input.employeeIds, ...input.resourceIds]
  );

  const latestByKey = new Map<string, LearningPathwayLatestSubmissionSummaryRow>();

  for (const row of rows as LearningPathwayLatestSubmissionSummaryRow[]) {
    const key = `${row.employeeId}:${row.resourceId}`;

    if (!latestByKey.has(key)) {
      latestByKey.set(key, row);
    }
  }

  return [...latestByKey.values()];
}

export async function createLearningPathwaySubmission(
  connection: PoolConnection,
  input: {
    employeeId: number;
    resourceId: string;
    submissionType: LearningPathwaySubmissionType;
    moduleIndex: number | null;
    submissionText: string;
    aiScore: number;
    aiFeedback: string;
    aiStrengths: string;
    aiImprovements: string;
    aiRecommendation: LearningPathwayAiRecommendation;
  }
) {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO learning_pathway_submissions (
       employee_id,
       resource_id,
       submission_type,
       module_index,
       submission_text,
       ai_score,
       ai_feedback,
       ai_strengths,
       ai_improvements,
       ai_recommendation
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.employeeId,
      input.resourceId,
      input.submissionType,
      input.moduleIndex,
      input.submissionText,
      input.aiScore,
      input.aiFeedback,
      input.aiStrengths,
      input.aiImprovements,
      input.aiRecommendation
    ]
  );

  return result.insertId;
}

export async function findLearningPathwaySubmissionById(submissionId: number) {
  const [rows] = await pool.query(
    `SELECT
       s.id,
       s.employee_id AS employeeId,
       u.full_name AS employeeName,
       s.resource_id AS resourceId,
       s.submission_type AS submissionType,
       s.module_index AS moduleIndex,
       s.submission_text AS submissionText,
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
     FROM learning_pathway_submissions s
     INNER JOIN employees e ON e.id = s.employee_id
     INNER JOIN users u ON u.id = e.user_id
     LEFT JOIN users reviewer ON reviewer.id = s.reviewed_by
     WHERE s.id = ?`,
    [submissionId]
  );

  return (rows as LearningPathwaySubmissionRow[])[0] ?? null;
}

export async function updateLearningPathwaySubmissionReview(
  connection: PoolConnection,
  input: {
    submissionId: number;
    status: LearningPathwaySubmissionStatus;
    reviewComment: string;
    reviewedBy: number;
  }
) {
  await connection.execute(
    `UPDATE learning_pathway_submissions
     SET status = ?, review_comment = ?, reviewed_by = ?, reviewed_at = NOW()
     WHERE id = ?`,
    [input.status, input.reviewComment, input.reviewedBy, input.submissionId]
  );
}
