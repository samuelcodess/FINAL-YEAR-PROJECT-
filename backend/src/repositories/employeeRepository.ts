import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

import { pool } from "../database/pool";

type EmployeeListRow = {
  id: number;
  userId: number;
  employeeCode: string;
  departmentId: number;
  position: string;
  hireDate: string;
  status: string;
  fullName: string;
  email: string;
  departmentName: string;
  latestTotalScore: number | null;
  latestPerformanceLevel: string | null;
  latestTrend: string | null;
};

type EmployeeProfileRow = {
  id: number;
  userId: number;
  employeeCode: string;
  departmentId: number;
  position: string;
  hireDate: string;
  status: string;
  fullName: string;
  email: string;
  departmentName: string;
};

type EmployeeHistoryRow = {
  id: number;
  evaluationDate: string;
  totalScore: number;
  performanceLevel: string;
  trend: string;
  remarks: string;
  recommendation: string;
};

export async function listEmployees(input?: {
  q?: string;
  status?: string;
  departmentId?: number;
  page?: number;
  pageSize?: number;
}) {
  const clauses: string[] = [];
  const params: Array<number | string> = [];

  if (input?.q?.trim()) {
    clauses.push("(u.full_name LIKE ? OR u.email LIKE ? OR e.employee_code LIKE ?)");
    const pattern = `%${input.q.trim()}%`;
    params.push(pattern, pattern, pattern);
  }

  if (input?.status) {
    clauses.push("e.status = ?");
    params.push(input.status);
  }

  if (input?.departmentId) {
    clauses.push("e.department_id = ?");
    params.push(input.departmentId);
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const page = Math.max(Number(input?.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(input?.pageSize ?? 10), 1), 50);
  const offset = (page - 1) * pageSize;

  const [rows] = await pool.query(
    `SELECT
       e.id,
       e.user_id AS userId,
       e.employee_code AS employeeCode,
       e.department_id AS departmentId,
       e.position,
       DATE_FORMAT(e.hire_date, '%Y-%m-%d') AS hireDate,
       e.status,
       u.full_name AS fullName,
       u.email,
       d.department_name AS departmentName,
       latest.total_score AS latestTotalScore,
       latest.performance_level AS latestPerformanceLevel,
       latest.trend AS latestTrend
     FROM employees e
     INNER JOIN users u ON u.id = e.user_id
     INNER JOIN departments d ON d.id = e.department_id
     LEFT JOIN (
       SELECT ev.*
       FROM evaluations ev
     INNER JOIN (
         SELECT employee_id, MAX(id) AS latestId
         FROM evaluations
         GROUP BY employee_id
       ) grouped ON grouped.latestId = ev.id
     ) latest ON latest.employee_id = e.id
     ${whereClause}
     ORDER BY u.full_name ASC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM employees e
     INNER JOIN users u ON u.id = e.user_id
     ${whereClause}`,
    params
  );

  return {
    items: rows as EmployeeListRow[],
    total: Number((countRows as Array<{ total: number }>)[0]?.total ?? 0)
  };
}

export async function findEmployeeById(employeeId: number) {
  const [rows] = await pool.query(
    `SELECT
       e.id,
       e.user_id AS userId,
       e.employee_code AS employeeCode,
       e.department_id AS departmentId,
       e.position,
       DATE_FORMAT(e.hire_date, '%Y-%m-%d') AS hireDate,
       e.status,
       u.full_name AS fullName,
       u.email,
       d.department_name AS departmentName
     FROM employees e
     INNER JOIN users u ON u.id = e.user_id
     INNER JOIN departments d ON d.id = e.department_id
     WHERE e.id = ?`,
    [employeeId]
  );

  return (rows as EmployeeProfileRow[])[0] ?? null;
}

export async function findEmployeeByCode(employeeCode: string) {
  const [rows] = await pool.query(
    `SELECT
       e.id,
       e.user_id AS userId,
       e.employee_code AS employeeCode,
       e.department_id AS departmentId,
       e.position,
       DATE_FORMAT(e.hire_date, '%Y-%m-%d') AS hireDate,
       e.status,
       u.full_name AS fullName,
       u.email,
       d.department_name AS departmentName
     FROM employees e
     INNER JOIN users u ON u.id = e.user_id
     INNER JOIN departments d ON d.id = e.department_id
     WHERE e.employee_code = ?`,
    [employeeCode]
  );

  return (rows as EmployeeProfileRow[])[0] ?? null;
}

export async function findEmployeeByUserId(userId: number) {
  const [rows] = await pool.query(
    `SELECT
       e.id,
       e.user_id AS userId,
       e.employee_code AS employeeCode,
       e.department_id AS departmentId,
       e.position,
       DATE_FORMAT(e.hire_date, '%Y-%m-%d') AS hireDate,
       e.status,
       u.full_name AS fullName,
       u.email,
       d.department_name AS departmentName
     FROM employees e
     INNER JOIN users u ON u.id = e.user_id
     INNER JOIN departments d ON d.id = e.department_id
     WHERE e.user_id = ?`,
    [userId]
  );

  return (rows as EmployeeProfileRow[])[0] ?? null;
}

export async function listEmployeeEvaluationHistory(employeeId: number) {
  const [rows] = await pool.query(
    `SELECT
       id,
       DATE_FORMAT(evaluation_date, '%Y-%m-%d') AS evaluationDate,
       total_score AS totalScore,
       performance_level AS performanceLevel,
       trend,
       remarks,
       recommendation
     FROM evaluations
     WHERE employee_id = ?
     ORDER BY evaluation_date DESC, id DESC`,
    [employeeId]
  );

  return rows as EmployeeHistoryRow[];
}

export async function createEmployee(
  connection: PoolConnection,
  input: {
    userId: number;
    employeeCode: string;
    departmentId: number;
    position: string;
    hireDate: string;
    status: string;
  }
) {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO employees (user_id, employee_code, department_id, position, hire_date, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.userId, input.employeeCode, input.departmentId, input.position, input.hireDate, input.status]
  );

  return result.insertId;
}

export async function updateEmployee(
  connection: PoolConnection,
  employeeId: number,
  input: {
    departmentId: number;
    position: string;
    hireDate: string;
    status: string;
  }
) {
  await connection.execute(
    `UPDATE employees
     SET department_id = ?, position = ?, hire_date = ?, status = ?
     WHERE id = ?`,
    [input.departmentId, input.position, input.hireDate, input.status, employeeId]
  );
}
