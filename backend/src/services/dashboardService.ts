import {
  getAdminMetrics,
  getDepartmentBreakdown,
  getHrMetrics,
  getLatestEvaluations,
  getScoreDistribution
} from "../repositories/analyticsRepository";
import { findEmployeeByUserId, listEmployeeEvaluationHistory } from "../repositories/employeeRepository";
import { listNotificationsForUser } from "../repositories/notificationRepository";
import { buildLearningPathwayAnalytics } from "./learningPathwayAssignmentService";
import { listRecommendationsWithMaterials } from "./recommendationService";

export async function getAdminDashboard() {
  const metrics = await getAdminMetrics();
  const departmentBreakdown = await getDepartmentBreakdown();
  const distributionRows = await getScoreDistribution();
  const learningPathwayAnalytics = await buildLearningPathwayAnalytics();

  return {
    metrics,
    departmentBreakdown,
    learningPathwayAnalytics,
    scoreDistribution: {
      excellent: distributionRows.find((item) => item.performanceLevel === "excellent")?.total ?? 0,
      veryGood: distributionRows.find((item) => item.performanceLevel === "very_good")?.total ?? 0,
      good: distributionRows.find((item) => item.performanceLevel === "good")?.total ?? 0,
      average: distributionRows.find((item) => item.performanceLevel === "average")?.total ?? 0,
      poor: distributionRows.find((item) => item.performanceLevel === "poor")?.total ?? 0
    }
  };
}

export async function getHrDashboard(userId: number) {
  const metrics = await getHrMetrics(userId);
  const latestEvaluations = await getLatestEvaluations(5);
  const recommendationSummary = await listRecommendationsWithMaterials({
    role: "hr_manager"
  });
  const learningPathwayAnalytics = await buildLearningPathwayAnalytics();

  return {
    metrics: {
      pendingEvaluations: metrics.pendingEvaluations,
      employeesTracked: metrics.activeEmployees,
      openRecommendations: metrics.openRecommendations,
      unreadNotifications: metrics.unreadNotifications
    },
    latestEvaluations,
    recommendationSummary,
    learningPathwayAnalytics
  };
}

export async function getEmployeeDashboard(userId: number) {
  const employee = await findEmployeeByUserId(userId);
  if (!employee) {
    return null;
  }

  const history = await listEmployeeEvaluationHistory(employee.id);
  const recommendations = await listRecommendationsWithMaterials({
    role: "employee",
    employeeId: employee.id
  });
  const notifications = await listNotificationsForUser(userId);

  return {
    employee,
    latestEvaluation: history[0] ?? null,
    evaluationHistory: [...history].reverse(),
    recommendations,
    notifications
  };
}
