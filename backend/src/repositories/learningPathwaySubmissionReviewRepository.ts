import type { PoolConnection } from "mysql2/promise";

import { pool } from "../database/pool";

export type LearningPathwaySubmissionReviewRow = {
  id: number;
  submissionId: number;
  reviewerId: number;
  reviewerName: string;
  status: "approved" | "needs_revision";
  comment: string | null;
  createdAt: string;
};

export async function createLearningPathwaySubmissionReview(
  connection: PoolConnection,
  input: {
    submissionId: number;
    reviewerId: number;
    status: "approved" | "needs_revision";
    comment?: string | null;
  }
) {
  await connection.execute(
    `INSERT INTO learning_pathway_submission_reviews (
       submission_id,
       reviewer_id,
       status,
       comment
     ) VALUES (?, ?, ?, ?)`,
    [input.submissionId, input.reviewerId, input.status, input.comment ?? null]
  );
}

export async function listLearningPathwaySubmissionReviews(submissionIds: number[]) {
  if (submissionIds.length === 0) {
    return [] as LearningPathwaySubmissionReviewRow[];
  }

  const placeholders = submissionIds.map(() => "?").join(", ");
  const [rows] = await pool.query(
    `SELECT
       review.id,
       review.submission_id AS submissionId,
       review.reviewer_id AS reviewerId,
       reviewer.full_name AS reviewerName,
       review.status,
       review.comment,
       DATE_FORMAT(review.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt
     FROM learning_pathway_submission_reviews review
     INNER JOIN users reviewer ON reviewer.id = review.reviewer_id
     WHERE review.submission_id IN (${placeholders})
     ORDER BY review.created_at DESC, review.id DESC`,
    submissionIds
  );

  return rows as LearningPathwaySubmissionReviewRow[];
}
