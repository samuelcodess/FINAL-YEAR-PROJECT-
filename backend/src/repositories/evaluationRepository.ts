import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

import { pool } from "../database/pool";
import type { RecommendationType, Trend } from "../types/domain";

type EvaluationListRow = {
  id: number;
  employeeId: number;
  evaluatorId: number;
  evaluationDate: string;
  totalScore: number;
  performanceLevel: string;
  recommendation: string;
  remarks: string;
  evidence: string;
  aiSummary: string;
  evaluationMode: string;
  trend: string;
  employeeName: string;
  departmentName: string;
};

type EvaluationDetailRow = {
  id: number;
  evaluationId: number;
  kpiId: number;
  score: number;
  kpiName: string;
};

type RecommendationRow = {
  id: number;
  evaluationId: number | null;
  employeeId: number;
  recommendationType: string;
  explanation: string;
  createdAt: string;
};

function isMissingEvaluationAiColumnError(error: unknown) {
  const databaseError = error as { code?: string };
  return databaseError?.code === "ER_BAD_FIELD_ERROR";
}

export async function listEvaluationsForRole(input: {
  role: string;
  userId: number;
  employeeId?: number | null;
}) {
  const params: Array<number | string> = [];
  let whereClause = "";

  if (input.role === "employee") {
    whereClause = "WHERE ev.employee_id = ?";
    params.push(input.employeeId ?? -1);
  }

  let evaluations: EvaluationListRow[] = [];

  try {
    const [rows] = await pool.query(
      `SELECT
         ev.id,
         ev.employee_id AS employeeId,
         ev.evaluator_id AS evaluatorId,
         DATE_FORMAT(ev.evaluation_date, '%Y-%m-%d') AS evaluationDate,
         ev.total_score AS totalScore,
         ev.performance_level AS performanceLevel,
         ev.recommendation,
         ev.remarks,
         ev.source_summary AS evidence,
         ev.ai_summary AS aiSummary,
         ev.evaluation_mode AS evaluationMode,
         ev.trend,
         u.full_name AS employeeName,
         d.department_name AS departmentName
       FROM evaluations ev
       INNER JOIN employees e ON e.id = ev.employee_id
       INNER JOIN users u ON u.id = e.user_id
       INNER JOIN departments d ON d.id = e.department_id
       ${whereClause}
       ORDER BY ev.evaluation_date DESC, ev.id DESC`,
      params
    );

    evaluations = rows as EvaluationListRow[];
  } catch (error) {
    if (!isMissingEvaluationAiColumnError(error)) {
      throw error;
    }

    const [legacyRows] = await pool.query(
      `SELECT
         ev.id,
         ev.employee_id AS employeeId,
         ev.evaluator_id AS evaluatorId,
         DATE_FORMAT(ev.evaluation_date, '%Y-%m-%d') AS evaluationDate,
         ev.total_score AS totalScore,
         ev.performance_level AS performanceLevel,
         ev.recommendation,
         ev.remarks,
         ev.remarks AS evidence,
         NULL AS aiSummary,
         'manual' AS evaluationMode,
         ev.trend,
         u.full_name AS employeeName,
         d.department_name AS departmentName
       FROM evaluations ev
       INNER JOIN employees e ON e.id = ev.employee_id
       INNER JOIN users u ON u.id = e.user_id
       INNER JOIN departments d ON d.id = e.department_id
       ${whereClause}
       ORDER BY ev.evaluation_date DESC, ev.id DESC`,
      params
    );

    evaluations = legacyRows as EvaluationListRow[];
  }

  if (evaluations.length === 0) {
    return [];
  }

  const evaluationIds = evaluations.map((item) => item.id);
  const placeholders = evaluationIds.map(() => "?").join(", ");

  const [detailRows] = await pool.query(
    `SELECT
       ed.id,
       ed.evaluation_id AS evaluationId,
       ed.kpi_id AS kpiId,
       ed.score,
       k.kpi_name AS kpiName
     FROM evaluation_details ed
     INNER JOIN kpis k ON k.id = ed.kpi_id
     WHERE ed.evaluation_id IN (${placeholders})
     ORDER BY ed.evaluation_id ASC, k.kpi_name ASC`,
    evaluationIds
  );

  const [recommendationRows] = await pool.query(
    `SELECT
       id,
       evaluation_id AS evaluationId,
       employee_id AS employeeId,
       recommendation_type AS recommendationType,
       explanation,
       created_at AS createdAt
     FROM recommendations
     WHERE evaluation_id IN (${placeholders})
     ORDER BY created_at DESC`,
    evaluationIds
  );

  const details = detailRows as EvaluationDetailRow[];
  const recommendations = recommendationRows as RecommendationRow[];

  return evaluations.map((evaluation) => ({
    ...evaluation,
    details: details.filter((detail) => detail.evaluationId === evaluation.id),
    generatedRecommendations: recommendations.filter(
      (recommendation) => recommendation.evaluationId === evaluation.id
    )
  }));
}

export async function listPreviousScores(employeeId: number) {
  const [rows] = await pool.query(
    `SELECT total_score AS totalScore
     FROM evaluations
     WHERE employee_id = ?
     ORDER BY evaluation_date ASC, id ASC`,
    [employeeId]
  );

  return (rows as Array<{ totalScore: number }>).map((row) => Number(row.totalScore));
}

export async function createEvaluationRecord(
  connection: PoolConnection,
  input: {
    employeeId: number;
    evaluatorId: number;
    evaluationDate: string;
    totalScore: number;
    performanceLevel: string;
    recommendation: string;
    remarks: string;
    evidence: string;
    aiSummary: string;
    evaluationMode: "manual" | "ai";
    trend: Trend;
  }
) {
  try {
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO evaluations (
         employee_id,
         evaluator_id,
         evaluation_date,
         total_score,
         performance_level,
         recommendation,
         remarks,
         source_summary,
         ai_summary,
         evaluation_mode,
         trend
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.employeeId,
        input.evaluatorId,
        input.evaluationDate,
        input.totalScore,
        input.performanceLevel,
        input.recommendation,
        input.remarks,
        input.evidence,
        input.aiSummary,
        input.evaluationMode,
        input.trend
      ]
    );

    return result.insertId;
  } catch (error) {
    if (!isMissingEvaluationAiColumnError(error)) {
      throw error;
    }

    const [legacyResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO evaluations (
         employee_id,
         evaluator_id,
         evaluation_date,
         total_score,
         performance_level,
         recommendation,
         remarks,
         trend
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.employeeId,
        input.evaluatorId,
        input.evaluationDate,
        input.totalScore,
        input.performanceLevel,
        input.recommendation,
        input.remarks,
        input.trend
      ]
    );

    return legacyResult.insertId;
  }
}

export async function insertEvaluationDetails(
  connection: PoolConnection,
  evaluationId: number,
  details: Array<{ kpiId: number; score: number }>
) {
  for (const detail of details) {
    await connection.execute(
      `INSERT INTO evaluation_details (evaluation_id, kpi_id, score)
       VALUES (?, ?, ?)`,
      [evaluationId, detail.kpiId, detail.score]
    );
  }
}

export async function insertRecommendations(
  connection: PoolConnection,
  input: {
    employeeId: number;
    evaluationId: number;
    types: RecommendationType[];
    explanation: string;
  }
) {
  for (const type of input.types) {
    await connection.execute(
      `INSERT INTO recommendations (employee_id, evaluation_id, recommendation_type, explanation)
       VALUES (?, ?, ?, ?)`,
      [input.employeeId, input.evaluationId, type, input.explanation]
    );
  }
}
