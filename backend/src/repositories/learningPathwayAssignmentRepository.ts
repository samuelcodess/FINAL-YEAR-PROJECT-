import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

import { pool } from "../database/pool";
import type { LearningPathwayCompletionDecision } from "../types/domain";

export type LearningPathwayAssignmentRow = {
  id: number;
  employeeId: number;
  employeeUserId: number;
  employeeName: string;
  resourceId: string;
  sourceEvaluationId: number | null;
  assignedBy: number | null;
  assignedByName: string | null;
  assignedAt: string;
  dueDate: string | null;
  completionDecision: LearningPathwayCompletionDecision;
  decisionComment: string | null;
  decidedBy: number | null;
  decidedByName: string | null;
  decidedAt: string | null;
  completedAt: string | null;
  baselineScore: number | null;
  followUpScore: number | null;
  improvementDelta: number | null;
};

function selectAssignmentColumns() {
  return `SELECT
      a.id,
      a.employee_id AS employeeId,
      employee_user.id AS employeeUserId,
      employee_user.full_name AS employeeName,
      a.resource_id AS resourceId,
      a.source_evaluation_id AS sourceEvaluationId,
      a.assigned_by AS assignedBy,
      assigner.full_name AS assignedByName,
      DATE_FORMAT(a.assigned_at, '%Y-%m-%d %H:%i:%s') AS assignedAt,
      DATE_FORMAT(a.due_date, '%Y-%m-%d') AS dueDate,
      a.completion_decision AS completionDecision,
      a.decision_comment AS decisionComment,
      a.decided_by AS decidedBy,
      decider.full_name AS decidedByName,
      DATE_FORMAT(a.decided_at, '%Y-%m-%d %H:%i:%s') AS decidedAt,
      DATE_FORMAT(a.completed_at, '%Y-%m-%d %H:%i:%s') AS completedAt,
      source.total_score AS baselineScore,
      follow_up.total_score AS followUpScore,
      CASE
        WHEN source.total_score IS NOT NULL AND follow_up.total_score IS NOT NULL
          THEN ROUND(follow_up.total_score - source.total_score, 2)
        ELSE NULL
      END AS improvementDelta
    FROM learning_pathway_assignments a
    INNER JOIN employees employee_record ON employee_record.id = a.employee_id
    INNER JOIN users employee_user ON employee_user.id = employee_record.user_id
    LEFT JOIN users assigner ON assigner.id = a.assigned_by
    LEFT JOIN users decider ON decider.id = a.decided_by
    LEFT JOIN evaluations source ON source.id = a.source_evaluation_id
    LEFT JOIN evaluations follow_up ON follow_up.id = (
      SELECT ev.id
      FROM evaluations ev
      WHERE ev.employee_id = a.employee_id
        AND a.source_evaluation_id IS NOT NULL
        AND source.evaluation_date IS NOT NULL
        AND (ev.evaluation_date > source.evaluation_date OR (ev.evaluation_date = source.evaluation_date AND ev.id > source.id))
      ORDER BY ev.evaluation_date DESC, ev.id DESC
      LIMIT 1
    )`;
}

export async function listLearningPathwayAssignments(input: {
  employeeIds: number[];
  resourceIds?: string[];
}) {
  if (input.employeeIds.length === 0) {
    return [] as LearningPathwayAssignmentRow[];
  }

  const employeePlaceholders = input.employeeIds.map(() => "?").join(", ");
  const params: Array<number | string> = [...input.employeeIds];
  let resourceClause = "";

  if (input.resourceIds && input.resourceIds.length > 0) {
    const resourcePlaceholders = input.resourceIds.map(() => "?").join(", ");
    resourceClause = ` AND a.resource_id IN (${resourcePlaceholders})`;
    params.push(...input.resourceIds);
  }

  const [rows] = await pool.query(
    `${selectAssignmentColumns()}
     WHERE a.employee_id IN (${employeePlaceholders})
     ${resourceClause}
     ORDER BY a.assigned_at DESC, a.id DESC`,
    params
  );

  return rows as LearningPathwayAssignmentRow[];
}

export async function listAllLearningPathwayAssignments() {
  const [rows] = await pool.query(
    `${selectAssignmentColumns()}
     ORDER BY a.assigned_at DESC, a.id DESC`
  );

  return rows as LearningPathwayAssignmentRow[];
}

export async function listActiveLearningPathwayAssignmentsWithDeadlines() {
  const [rows] = await pool.query(
    `${selectAssignmentColumns()}
     WHERE a.due_date IS NOT NULL
       AND a.completion_decision = 'in_progress'
     ORDER BY a.due_date ASC, a.id ASC`
  );

  return rows as LearningPathwayAssignmentRow[];
}

export async function findLearningPathwayAssignmentByEmployeeAndResource(input: {
  employeeId: number;
  resourceId: string;
}) {
  const [rows] = await pool.query(
    `${selectAssignmentColumns()}
     WHERE a.employee_id = ? AND a.resource_id = ?
     LIMIT 1`,
    [input.employeeId, input.resourceId]
  );

  return (rows as LearningPathwayAssignmentRow[])[0] ?? null;
}

export async function findLearningPathwayAssignmentById(assignmentId: number) {
  const [rows] = await pool.query(
    `${selectAssignmentColumns()}
     WHERE a.id = ?
     LIMIT 1`,
    [assignmentId]
  );

  return (rows as LearningPathwayAssignmentRow[])[0] ?? null;
}

export async function upsertLearningPathwayAssignment(
  connection: PoolConnection,
  input: {
    employeeId: number;
    resourceId: string;
    sourceEvaluationId?: number | null;
    assignedBy?: number | null;
    dueDate?: string | null;
  }
) {
  const [result] = await connection.execute<ResultSetHeader>(
    `INSERT INTO learning_pathway_assignments (
       employee_id,
       resource_id,
       source_evaluation_id,
       assigned_by,
       due_date
     ) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       source_evaluation_id = COALESCE(learning_pathway_assignments.source_evaluation_id, VALUES(source_evaluation_id)),
       assigned_by = COALESCE(learning_pathway_assignments.assigned_by, VALUES(assigned_by)),
       due_date = COALESCE(learning_pathway_assignments.due_date, VALUES(due_date))`,
    [
      input.employeeId,
      input.resourceId,
      input.sourceEvaluationId ?? null,
      input.assignedBy ?? null,
      input.dueDate ?? null
    ]
  );

  return result.insertId;
}

export async function updateLearningPathwayAssignment(
  connection: PoolConnection,
  input: {
    assignmentId: number;
    dueDate?: string | null;
    completionDecision?: LearningPathwayCompletionDecision;
    decisionComment?: string | null;
    decidedBy?: number | null;
    completedAt?: string | null;
    stampDecisionAt?: boolean;
  }
) {
  await connection.execute(
    `UPDATE learning_pathway_assignments
     SET due_date = ?,
         completion_decision = ?,
         decision_comment = ?,
         decided_by = ?,
         decided_at = CASE
           WHEN ? = 0 THEN decided_at
           ELSE NOW()
         END,
         completed_at = ?
     WHERE id = ?`,
    [
      input.dueDate ?? null,
      input.completionDecision ?? "in_progress",
      input.decisionComment ?? null,
      input.decidedBy ?? null,
      input.stampDecisionAt ? 1 : 0,
      input.completedAt ?? null,
      input.assignmentId
    ]
  );
}
