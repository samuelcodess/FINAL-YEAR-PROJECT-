import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

import { pool } from "../database/pool";
import type { AppRole } from "../constants/roles";

type UserRow = {
  id: number;
  fullName: string;
  email: string;
  password: string;
  role: AppRole;
  mustChangePassword: boolean;
  createdAt: string;
};

export async function findUserByEmail(email: string) {
  const [rows] = await pool.query(
    `SELECT id, full_name AS fullName, email, password, role, must_change_password AS mustChangePassword, created_at AS createdAt
     FROM users
     WHERE email = ?`,
    [email]
  );

  return (rows as UserRow[])[0] ?? null;
}

export async function findUserById(userId: number) {
  const [rows] = await pool.query(
    `SELECT id, full_name AS fullName, email, password, role, must_change_password AS mustChangePassword, created_at AS createdAt
     FROM users
     WHERE id = ?`,
    [userId]
  );

  return (rows as UserRow[])[0] ?? null;
}

export async function listUsers(input: {
  page: number;
  pageSize: number;
  q?: string;
  role?: AppRole | "";
}) {
  const clauses: string[] = [];
  const params: Array<number | string> = [];

  if (input.q?.trim()) {
    clauses.push("(u.full_name LIKE ? OR u.email LIKE ?)");
    const pattern = `%${input.q.trim()}%`;
    params.push(pattern, pattern);
  }

  if (input.role) {
    clauses.push("u.role = ?");
    params.push(input.role);
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const offset = (input.page - 1) * input.pageSize;

  const [rows] = await pool.query(
    `SELECT
       u.id,
       u.full_name AS fullName,
       u.email,
       u.role,
       u.must_change_password AS mustChangePassword,
       u.created_at AS createdAt,
       e.id AS employeeId,
       e.employee_code AS employeeCode,
       d.department_name AS departmentName,
       e.position
     FROM users u
     LEFT JOIN employees e ON e.user_id = u.id
     LEFT JOIN departments d ON d.id = e.department_id
     ${whereClause}
     ORDER BY u.created_at DESC, u.id DESC
     LIMIT ? OFFSET ?`,
    [...params, input.pageSize, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM users u
     ${whereClause}`,
    params
  );

  return {
    items: rows,
    total: Number((countRows as Array<{ total: number }>)[0]?.total ?? 0)
  };
}

export async function createUser(
  connection: PoolConnection,
  input: {
    fullName: string;
    email: string;
    password: string;
    role: AppRole;
    mustChangePassword?: boolean;
  }
) {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO users (full_name, email, password, role, must_change_password)
     VALUES (?, ?, ?, ?, ?)`,
    [input.fullName, input.email, input.password, input.role, input.mustChangePassword ?? false]
  );

  return result.insertId;
}

export async function updateUserBasicDetails(
  connection: PoolConnection,
  userId: number,
  input: {
    fullName: string;
    email: string;
  }
) {
  await connection.execute(
    `UPDATE users
     SET full_name = ?, email = ?
     WHERE id = ?`,
    [input.fullName, input.email, userId]
  );
}

export async function updateUserRole(connection: PoolConnection, userId: number, role: AppRole) {
  await connection.execute(
    `UPDATE users
     SET role = ?
     WHERE id = ?`,
    [role, userId]
  );
}

export async function updateUserPassword(
  connection: PoolConnection,
  userId: number,
  password: string,
  mustChangePassword = false
) {
  await connection.execute(
    `UPDATE users
     SET password = ?, must_change_password = ?
     WHERE id = ?`,
    [password, mustChangePassword, userId]
  );
}

export async function deleteUserById(connection: PoolConnection, userId: number) {
  await connection.execute(`DELETE FROM users WHERE id = ?`, [userId]);
}
