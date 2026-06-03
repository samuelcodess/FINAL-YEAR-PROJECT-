import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

import { pool } from "../database/pool";

type PasswordResetRow = {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

export async function createPasswordResetToken(
  connection: PoolConnection,
  input: {
    userId: number;
    tokenHash: string;
    expiresAt: Date;
  }
) {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [input.userId, input.tokenHash, input.expiresAt]
  );

  return result.insertId;
}

export async function findActivePasswordResetToken(tokenHash: string) {
  const [rows] = await pool.query(
    `SELECT
       id,
       user_id AS userId,
       token_hash AS tokenHash,
       expires_at AS expiresAt,
       used_at AS usedAt,
       created_at AS createdAt
     FROM password_reset_tokens
     WHERE token_hash = ?
       AND used_at IS NULL
       AND expires_at > NOW()
     ORDER BY id DESC
     LIMIT 1`,
    [tokenHash]
  );

  return (rows as PasswordResetRow[])[0] ?? null;
}

export async function markPasswordResetTokenUsed(connection: PoolConnection, tokenId: number) {
  await connection.execute(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE id = ?`,
    [tokenId]
  );
}
