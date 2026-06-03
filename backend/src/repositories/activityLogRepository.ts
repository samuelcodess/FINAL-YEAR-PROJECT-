import type { PoolConnection } from "mysql2/promise";

import { pool } from "../database/pool";

export async function createActivityLog(
  connection: PoolConnection,
  input: {
    userId: number;
    action: string;
  }
) {
  await connection.execute(
    `INSERT INTO activity_logs (user_id, action)
     VALUES (?, ?)`,
    [input.userId, input.action]
  );
}

export async function listActivityLogs(input: {
  page: number;
  pageSize: number;
  q?: string;
}) {
  const clauses: string[] = [];
  const params: Array<number | string> = [];

  if (input.q?.trim()) {
    clauses.push("(u.full_name LIKE ? OR al.action LIKE ?)");
    const pattern = `%${input.q.trim()}%`;
    params.push(pattern, pattern);
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const offset = (input.page - 1) * input.pageSize;

  const [rows] = await pool.query(
    `SELECT
       al.id,
       al.user_id AS userId,
       u.full_name AS fullName,
       u.email,
       u.role,
       al.action,
       al.timestamp
     FROM activity_logs al
     INNER JOIN users u ON u.id = al.user_id
     ${whereClause}
     ORDER BY al.timestamp DESC, al.id DESC
     LIMIT ? OFFSET ?`,
    [...params, input.pageSize, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM activity_logs al
     INNER JOIN users u ON u.id = al.user_id
     ${whereClause}`,
    params
  );

  return {
    items: rows,
    total: Number((countRows as Array<{ total: number }>)[0]?.total ?? 0)
  };
}
