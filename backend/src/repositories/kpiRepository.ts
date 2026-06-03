import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

import { pool } from "../database/pool";

type KpiRow = {
  id: number;
  kpiName: string;
  weightPercentage: number;
  description: string;
};

export async function listKpis() {
  const [rows] = await pool.query(
    `SELECT
       id,
       kpi_name AS kpiName,
       weight_percentage AS weightPercentage,
       description
     FROM kpis
     ORDER BY id ASC`
  );

  return rows as KpiRow[];
}

export async function findKpisByIds(kpiIds: number[]) {
  if (kpiIds.length === 0) {
    return [];
  }

  const placeholders = kpiIds.map(() => "?").join(", ");
  const [rows] = await pool.query(
    `SELECT
       id,
       kpi_name AS kpiName,
       weight_percentage AS weightPercentage,
       description
     FROM kpis
     WHERE id IN (${placeholders})`,
    kpiIds
  );

  return rows as KpiRow[];
}

export async function getTotalKpiWeight() {
  const [rows] = await pool.query(
    `SELECT COALESCE(SUM(weight_percentage), 0) AS totalWeight
     FROM kpis`
  );

  return Number((rows as Array<{ totalWeight: number }>)[0]?.totalWeight ?? 0);
}

export async function createKpi(
  connection: PoolConnection,
  input: {
    kpiName: string;
    weightPercentage: number;
    description: string;
  }
) {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO kpis (kpi_name, weight_percentage, description)
     VALUES (?, ?, ?)`,
    [input.kpiName, input.weightPercentage, input.description]
  );

  return result.insertId;
}

export async function updateKpi(
  connection: PoolConnection,
  kpiId: number,
  input: {
    kpiName: string;
    weightPercentage: number;
    description: string;
  }
) {
  await connection.execute(
    `UPDATE kpis
     SET kpi_name = ?, weight_percentage = ?, description = ?
     WHERE id = ?`,
    [input.kpiName, input.weightPercentage, input.description, kpiId]
  );
}

export async function deleteKpi(connection: PoolConnection, kpiId: number) {
  await connection.execute(`DELETE FROM kpis WHERE id = ?`, [kpiId]);
}

export async function findKpiById(kpiId: number) {
  const [rows] = await pool.query(
    `SELECT
       id,
       kpi_name AS kpiName,
       weight_percentage AS weightPercentage,
       description
     FROM kpis
     WHERE id = ?`,
    [kpiId]
  );

  return (rows as KpiRow[])[0] ?? null;
}

export async function findKpiByName(kpiName: string) {
  const [rows] = await pool.query(
    `SELECT
       id,
       kpi_name AS kpiName,
       weight_percentage AS weightPercentage,
       description
     FROM kpis
     WHERE LOWER(kpi_name) = LOWER(?)`,
    [kpiName]
  );

  return (rows as KpiRow[])[0] ?? null;
}
