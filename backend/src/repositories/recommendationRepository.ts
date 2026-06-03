import { pool } from "../database/pool";

export async function listRecommendationsForRole(input: {
  role: string;
  employeeId?: number | null;
}) {
  const params: Array<number | string> = [];
  let whereClause = "";

  if (input.role === "employee") {
    whereClause = "WHERE r.employee_id = ?";
    params.push(input.employeeId ?? -1);
  }

  const [rows] = await pool.query(
    `SELECT
       r.id,
       r.employee_id AS employeeId,
       r.evaluation_id AS evaluationId,
       r.recommendation_type AS recommendationType,
       r.explanation,
       r.created_at AS createdAt,
       u.full_name AS employeeName
     FROM recommendations r
     INNER JOIN employees e ON e.id = r.employee_id
     INNER JOIN users u ON u.id = e.user_id
     ${whereClause}
     ORDER BY r.created_at DESC`,
    params
  );

  const recommendations = rows as Array<{
    id: number;
    employeeId: number;
    evaluationId: number | null;
    recommendationType: string;
    explanation: string;
    createdAt: string;
    employeeName: string;
  }>;

  const evaluationIds = [...new Set(
    recommendations
      .map((item) => item.evaluationId)
      .filter((item): item is number => item !== null)
  )];

  if (evaluationIds.length === 0) {
    return recommendations.map((item) => ({
      ...item,
      focusAreas: []
    }));
  }

  const placeholders = evaluationIds.map(() => "?").join(", ");
  const [detailRows] = await pool.query(
    `SELECT
       ed.evaluation_id AS evaluationId,
       ed.score,
       k.kpi_name AS kpiName
     FROM evaluation_details ed
     INNER JOIN kpis k ON k.id = ed.kpi_id
     WHERE ed.evaluation_id IN (${placeholders})
     ORDER BY ed.evaluation_id ASC, ed.score ASC, k.kpi_name ASC`,
    evaluationIds
  );

  const focusRows = detailRows as Array<{
    evaluationId: number;
    score: number;
    kpiName: string;
  }>;

  return recommendations.map((item) => ({
    ...item,
    focusAreas:
      item.evaluationId === null
        ? []
        : focusRows
            .filter((detail) => detail.evaluationId === item.evaluationId && Number(detail.score) < 70)
            .slice(0, 3)
            .map((detail) => ({
              kpiName: detail.kpiName,
              score: Number(detail.score)
            }))
  }));
}
