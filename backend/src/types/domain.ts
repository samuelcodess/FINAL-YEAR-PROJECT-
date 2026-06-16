import type { AppRole } from "../constants/roles";

export type PerformanceLevel =
  | "excellent"
  | "very_good"
  | "good"
  | "average"
  | "poor";

export type Trend = "improving" | "stable" | "declining";

export type RecommendationType =
  | "promotion"
  | "leadership"
  | "bonus"
  | "advanced_responsibility"
  | "training"
  | "skill_development"
  | "performance_improvement_plan"
  | "recognition"
  | "warning";

export type FocusArea = {
  kpiName: string;
  score: number;
};

export type LearningMaterial = {
  id: string;
  resourceId: string;
  resourceUrl: string;
  title: string;
  description: string;
  format: string;
  targetArea: string;
  estimatedDuration: string;
  actionType: string;
  completedModuleIndexes?: number[];
  assignmentId?: number | null;
  assignedAt?: string | null;
  dueDate?: string | null;
  completionDecision?: LearningPathwayCompletionDecision;
  decisionComment?: string | null;
  decidedAt?: string | null;
  completedAt?: string | null;
  improvementDelta?: number | null;
  baselineScore?: number | null;
  followUpScore?: number | null;
};

export type LearningPathwaySubmissionType = "module" | "final_assignment";
export type LearningPathwaySubmissionStatus = "submitted" | "approved" | "needs_revision";
export type LearningPathwayAiRecommendation = "ready_for_review" | "needs_revision";
export type LearningPathwayCompletionDecision = "in_progress" | "completed" | "follow_up_required";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "completed"
  | "needs_revision"
  | "cancelled";
export type TaskSubmissionStatus = "submitted" | "approved" | "needs_revision";
export type TaskSubmissionAiRecommendation = "ready_for_review" | "needs_revision";

export type UserRecord = {
  id: number;
  fullName: string;
  email: string;
  password: string;
  role: AppRole;
  mustChangePassword: boolean;
  createdAt: string;
};

export type DepartmentRecord = {
  id: number;
  departmentName: string;
};

export type EmployeeRecord = {
  id: number;
  userId: number;
  employeeCode: string;
  departmentId: number;
  position: string;
  hireDate: string;
  status: "active" | "on_leave" | "inactive" | "terminated";
};

export type KpiRecord = {
  id: number;
  kpiName: string;
  weightPercentage: number;
  description: string;
};

export type EvaluationDetailInput = {
  kpiId: number;
  score: number;
};

export type EvaluationRecord = {
  id: number;
  employeeId: number;
  evaluatorId: number;
  evaluationDate: string;
  totalScore: number;
  performanceLevel: PerformanceLevel;
  recommendation: string;
  remarks: string;
  evidence: string;
  aiSummary: string;
  evaluationMode: "manual" | "ai";
  trend: Trend;
};

export type EvaluationDetailRecord = {
  id: number;
  evaluationId: number;
  kpiId: number;
  score: number;
};

export type RecommendationRecord = {
  id: number;
  employeeId: number;
  evaluationId: number | null;
  recommendationType: RecommendationType;
  explanation: string;
  createdAt: string;
};

export type NotificationRecord = {
  id: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type ActivityLogRecord = {
  id: number;
  userId: number;
  action: string;
  timestamp: string;
};

export type AuthPayload = {
  sub: number;
  role: AppRole;
  email: string;
};

export type AuthenticatedUser = {
  id: number;
  role: AppRole;
  email: string;
};
