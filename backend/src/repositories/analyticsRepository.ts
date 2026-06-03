import { pool } from "../database/pool";

export async function getAdminMetrics() {
  const [rows] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM users) AS totalUsers,
       (SELECT COUNT(*) FROM employees) AS totalEmployees,
       (SELECT COUNT(*) FROM departments) AS totalDepartments,
       (SELECT COUNT(*) FROM evaluations) AS totalEvaluations`
  );

  return (rows as Array<{
    totalUsers: number;
    totalEmployees: number;
    totalDepartments: number;
    totalEvaluations: number;
  }>)[0];
}

export async function getDepartmentBreakdown() {
  const [rows] = await pool.query(
    `SELECT
       d.id,
       d.department_name AS departmentName,
       COUNT(e.id) AS employeeCount
     FROM departments d
     LEFT JOIN employees e ON e.department_id = d.id
     GROUP BY d.id, d.department_name
     ORDER BY d.department_name ASC`
  );

  return rows;
}

export async function getScoreDistribution() {
  const [rows] = await pool.query(
    `SELECT performance_level AS performanceLevel, COUNT(*) AS total
     FROM evaluations
     GROUP BY performance_level`
  );

  return rows as Array<{ performanceLevel: string; total: number }>;
}

export async function getHrMetrics(userId: number) {
  const [rows] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM employees WHERE status = 'active') AS activeEmployees,
       (
         SELECT COUNT(*)
         FROM recommendations
       ) AS openRecommendations,
       (
         SELECT COUNT(*)
         FROM notifications
         WHERE user_id = ? AND is_read = FALSE
       ) AS unreadNotifications,
       (
         SELECT COUNT(*)
         FROM employees e
         WHERE e.status = 'active'
           AND e.id NOT IN (
             SELECT DISTINCT ev.employee_id
             FROM evaluations ev
             WHERE ev.evaluation_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
           )
       ) AS pendingEvaluations`,
    [userId]
  );

  return (rows as Array<{
    activeEmployees: number;
    openRecommendations: number;
    unreadNotifications: number;
    pendingEvaluations: number;
  }>)[0];
}

export async function getLatestEvaluations(limit = 5) {
  const [rows] = await pool.query(
    `SELECT
       id,
       DATE_FORMAT(evaluation_date, '%Y-%m-%d') AS evaluationDate,
       total_score AS totalScore,
       performance_level AS performanceLevel,
       trend
     FROM evaluations
     ORDER BY evaluation_date DESC, id DESC
     LIMIT ?`,
    [limit]
  );

  return rows;
}
