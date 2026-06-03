import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

import { pool } from "../database/pool";
import type { TaskPriority, TaskStatus } from "../types/domain";

export type TaskRow = {
  id: number;
  employeeId: number;
  employeeUserId: number;
  employeeName: string;
  employeeCode: string;
  departmentName: string | null;
  assignedBy: number;
  assignedByName: string;
  title: string;
  description: string;
  linkedKpiId: number | null;
  linkedKpiName: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  submittedAt: string | null;
  reviewedBy: number | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;
  createdAt: string;
  updatedAt: string;
};

function buildListWhereClause(input: {
  employeeId?: number;
  status?: string;
  q?: string;
  scope?: string;
}) {
  const clauses: string[] = [];
  const params: Array<number | string> = [];

  if (input.employeeId) {
    clauses.push("t.employee_id = ?");
    params.push(input.employeeId);
  }

  if (input.status?.trim()) {
    clauses.push("t.status = ?");
    params.push(input.status.trim());
  } else if (input.scope === "active") {
    clauses.push("t.status NOT IN ('completed', 'cancelled')");
  } else if (input.scope === "history") {
    clauses.push("t.status IN ('completed', 'cancelled')");
  }

  if (input.q?.trim()) {
    const pattern = `%${input.q.trim()}%`;
    clauses.push("(t.title LIKE ? OR t.description LIKE ? OR employee_user.full_name LIKE ? OR e.employee_code LIKE ?)");
    params.push(pattern, pattern, pattern, pattern);
  }

  return {
    whereClause: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    params
  };
}

export async function listTasks(input: {
  employeeId?: number;
  status?: string;
  q?: string;
  scope?: string;
  page: number;
  pageSize: number;
}) {
  const { whereClause, params } = buildListWhereClause(input);
  const offset = (input.page - 1) * input.pageSize;

  const [rows] = await pool.query(
    `SELECT
       t.id,
       t.employee_id AS employeeId,
       e.user_id AS employeeUserId,
       employee_user.full_name AS employeeName,
       e.employee_code AS employeeCode,
       d.department_name AS departmentName,
       t.assigned_by AS assignedBy,
       assigner.full_name AS assignedByName,
       t.title,
       t.description,
       t.linked_kpi_id AS linkedKpiId,
       k.kpi_name AS linkedKpiName,
       t.priority,
       t.status,
       DATE_FORMAT(t.due_date, '%Y-%m-%d') AS dueDate,
       DATE_FORMAT(t.submitted_at, '%Y-%m-%d %H:%i:%s') AS submittedAt,
       t.reviewed_by AS reviewedBy,
       reviewer.full_name AS reviewedByName,
       DATE_FORMAT(t.reviewed_at, '%Y-%m-%d %H:%i:%s') AS reviewedAt,
       t.review_comment AS reviewComment,
       DATE_FORMAT(t.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
       DATE_FORMAT(t.updated_at, '%Y-%m-%d %H:%i:%s') AS updatedAt
     FROM tasks t
     INNER JOIN employees e ON e.id = t.employee_id
     INNER JOIN users employee_user ON employee_user.id = e.user_id
     LEFT JOIN departments d ON d.id = e.department_id
     INNER JOIN users assigner ON assigner.id = t.assigned_by
     LEFT JOIN users reviewer ON reviewer.id = t.reviewed_by
     LEFT JOIN kpis k ON k.id = t.linked_kpi_id
     ${whereClause}
     ORDER BY
       CASE
         WHEN t.status = 'needs_revision' THEN 0
         WHEN t.status = 'submitted' THEN 1
         WHEN t.status = 'in_progress' THEN 2
         WHEN t.status = 'not_started' THEN 3
         WHEN t.status = 'completed' THEN 4
         ELSE 5
       END,
       t.due_date IS NULL,
       t.due_date ASC,
       t.updated_at DESC,
       t.id DESC
     LIMIT ? OFFSET ?`,
    [...params, input.pageSize, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM tasks t
     INNER JOIN employees e ON e.id = t.employee_id
     INNER JOIN users employee_user ON employee_user.id = e.user_id
     ${whereClause}`,
    params
  );

  return {
    items: rows as TaskRow[],
    total: Number((countRows as Array<{ total: number }>)[0]?.total ?? 0)
  };
}

export async function findTaskById(taskId: number) {
  const [rows] = await pool.query(
    `SELECT
       t.id,
       t.employee_id AS employeeId,
       e.user_id AS employeeUserId,
       employee_user.full_name AS employeeName,
       e.employee_code AS employeeCode,
       d.department_name AS departmentName,
       t.assigned_by AS assignedBy,
       assigner.full_name AS assignedByName,
       t.title,
       t.description,
       t.linked_kpi_id AS linkedKpiId,
       k.kpi_name AS linkedKpiName,
       t.priority,
       t.status,
       DATE_FORMAT(t.due_date, '%Y-%m-%d') AS dueDate,
       DATE_FORMAT(t.submitted_at, '%Y-%m-%d %H:%i:%s') AS submittedAt,
       t.reviewed_by AS reviewedBy,
       reviewer.full_name AS reviewedByName,
       DATE_FORMAT(t.reviewed_at, '%Y-%m-%d %H:%i:%s') AS reviewedAt,
       t.review_comment AS reviewComment,
       DATE_FORMAT(t.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
       DATE_FORMAT(t.updated_at, '%Y-%m-%d %H:%i:%s') AS updatedAt
     FROM tasks t
     INNER JOIN employees e ON e.id = t.employee_id
     INNER JOIN users employee_user ON employee_user.id = e.user_id
     LEFT JOIN departments d ON d.id = e.department_id
     INNER JOIN users assigner ON assigner.id = t.assigned_by
     LEFT JOIN users reviewer ON reviewer.id = t.reviewed_by
     LEFT JOIN kpis k ON k.id = t.linked_kpi_id
     WHERE t.id = ?`,
    [taskId]
  );

  return (rows as TaskRow[])[0] ?? null;
}

export async function createTask(
  connection: PoolConnection,
  input: {
    employeeId: number;
    assignedBy: number;
    title: string;
    description: string;
    linkedKpiId: number | null;
    priority: TaskPriority;
    dueDate: string | null;
  }
) {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO tasks (
       employee_id,
       assigned_by,
       title,
       description,
       linked_kpi_id,
       priority,
       status,
       due_date
     ) VALUES (?, ?, ?, ?, ?, ?, 'not_started', ?)`,
    [
      input.employeeId,
      input.assignedBy,
      input.title,
      input.description,
      input.linkedKpiId,
      input.priority,
      input.dueDate
    ]
  );

  return result.insertId;
}

export async function updateTaskStatus(
  connection: PoolConnection,
  input: {
    taskId: number;
    status: TaskStatus;
    submittedAt?: string | null;
    reviewedBy?: number | null;
    reviewedAt?: string | null;
    reviewComment?: string | null;
  }
) {
  await connection.execute(
    `UPDATE tasks
     SET status = ?,
         submitted_at = ?,
         reviewed_by = ?,
         reviewed_at = ?,
         review_comment = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      input.status,
      input.submittedAt ?? null,
      input.reviewedBy ?? null,
      input.reviewedAt ?? null,
      input.reviewComment ?? null,
      input.taskId
    ]
  );
}

export async function updateTaskMetadata(
  connection: PoolConnection,
  input: {
    taskId: number;
    title: string;
    description: string;
    linkedKpiId: number | null;
    priority: TaskPriority;
    dueDate: string | null;
    status: TaskStatus;
  }
) {
  await connection.execute(
    `UPDATE tasks
     SET title = ?,
         description = ?,
         linked_kpi_id = ?,
         priority = ?,
         due_date = ?,
         status = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      input.title,
      input.description,
      input.linkedKpiId,
      input.priority,
      input.dueDate,
      input.status,
      input.taskId
    ]
  );
}
