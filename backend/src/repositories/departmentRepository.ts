import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

import { pool } from "../database/pool";

type DepartmentRow = {
  id: number;
  departmentName: string;
};

export async function listDepartments() {
  const [rows] = await pool.query(
    `SELECT id, department_name AS departmentName
     FROM departments
     ORDER BY department_name ASC`
  );

  return rows as DepartmentRow[];
}

export async function findDepartmentById(departmentId: number) {
  const [rows] = await pool.query(
    `SELECT id, department_name AS departmentName
     FROM departments
     WHERE id = ?`,
    [departmentId]
  );

  return (rows as DepartmentRow[])[0] ?? null;
}

export async function createDepartment(connection: PoolConnection, departmentName: string) {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO departments (department_name)
     VALUES (?)`,
    [departmentName]
  );

  return result.insertId;
}

export async function updateDepartment(
  connection: PoolConnection,
  departmentId: number,
  departmentName: string
) {
  await connection.execute(
    `UPDATE departments
     SET department_name = ?
     WHERE id = ?`,
    [departmentName, departmentId]
  );
}

export async function deleteDepartment(connection: PoolConnection, departmentId: number) {
  await connection.execute(`DELETE FROM departments WHERE id = ?`, [departmentId]);
}
