import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

import { pool } from "../database/pool";

type ProgressRow = {
  employeeId: number;
  resourceId: string;
  moduleIndex: number;
  completedAt: string;
};

export async function listLearningPathwayProgress(input: {
  employeeIds: number[];
  resourceIds?: string[];
}) {
  if (input.employeeIds.length === 0) {
    return [] as ProgressRow[];
  }

  const employeePlaceholders = input.employeeIds.map(() => "?").join(", ");
  const params: Array<number | string> = [...input.employeeIds];
  let resourceClause = "";

  if (input.resourceIds && input.resourceIds.length > 0) {
    const resourcePlaceholders = input.resourceIds.map(() => "?").join(", ");
    resourceClause = ` AND resource_id IN (${resourcePlaceholders})`;
    params.push(...input.resourceIds);
  }

  const [rows] = await pool.query(
    `SELECT
       employee_id AS employeeId,
       resource_id AS resourceId,
       module_index AS moduleIndex,
       completed_at AS completedAt
     FROM learning_pathway_progress
     WHERE employee_id IN (${employeePlaceholders})
     ${resourceClause}
     ORDER BY employee_id ASC, resource_id ASC, module_index ASC`,
    params
  );

  return rows as ProgressRow[];
}

export async function markLearningPathwayModuleComplete(
  connection: PoolConnection,
  input: {
    employeeId: number;
    resourceId: string;
    moduleIndex: number;
  }
) {
  await connection.execute<ResultSetHeader>(
    `INSERT INTO learning_pathway_progress (employee_id, resource_id, module_index)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE completed_at = CURRENT_TIMESTAMP`,
    [input.employeeId, input.resourceId, input.moduleIndex]
  );
}

export async function removeLearningPathwayModuleCompletion(
  connection: PoolConnection,
  input: {
    employeeId: number;
    resourceId: string;
    moduleIndex: number;
  }
) {
  await connection.execute(
    `DELETE FROM learning_pathway_progress
     WHERE employee_id = ? AND resource_id = ? AND module_index = ?`,
    [input.employeeId, input.resourceId, input.moduleIndex]
  );
}
