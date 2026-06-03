import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

import { pool } from "../database/pool";

export type TaskSubmissionAttachmentRow = {
  id: number;
  submissionId: number;
  originalName: string;
  storedName: string;
  mimeType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: string;
};

export async function createTaskSubmissionAttachment(
  connection: PoolConnection,
  input: {
    submissionId: number;
    originalName: string;
    storedName: string;
    mimeType: string;
    fileSize: number;
    fileUrl: string;
  }
) {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO task_submission_attachments (
       submission_id,
       original_name,
       stored_name,
       mime_type,
       file_size,
       file_url
     ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.submissionId,
      input.originalName,
      input.storedName,
      input.mimeType,
      input.fileSize,
      input.fileUrl
    ]
  );

  return result.insertId;
}

export async function listTaskSubmissionAttachments(submissionIds: number[]) {
  if (submissionIds.length === 0) {
    return [] as TaskSubmissionAttachmentRow[];
  }

  const placeholders = submissionIds.map(() => "?").join(", ");
  const [rows] = await pool.query(
    `SELECT
       id,
       submission_id AS submissionId,
       original_name AS originalName,
       stored_name AS storedName,
       mime_type AS mimeType,
       file_size AS fileSize,
       file_url AS fileUrl,
       DATE_FORMAT(uploaded_at, '%Y-%m-%d %H:%i:%s') AS uploadedAt
     FROM task_submission_attachments
     WHERE submission_id IN (${placeholders})
     ORDER BY uploaded_at DESC, id DESC`,
    submissionIds
  );

  return rows as TaskSubmissionAttachmentRow[];
}
