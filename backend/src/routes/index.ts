import { Router } from "express";

import { activityLogRoutes } from "./activityLogRoutes";
import { authRoutes } from "./authRoutes";
import { dashboardRoutes } from "./dashboardRoutes";
import { departmentRoutes } from "./departmentRoutes";
import { employeeRoutes } from "./employeeRoutes";
import { evaluationRoutes } from "./evaluationRoutes";
import { kpiRoutes } from "./kpiRoutes";
import { learningPathwayAssignmentRoutes } from "./learningPathwayAssignmentRoutes";
import { learningPathwayProgressRoutes } from "./learningPathwayProgressRoutes";
import { learningPathwaySubmissionRoutes } from "./learningPathwaySubmissionRoutes";
import { notificationRoutes } from "./notificationRoutes";
import { recommendationRoutes } from "./recommendationRoutes";
import { reportRoutes } from "./reportRoutes";
import { settingsRoutes } from "./settingsRoutes";
import { taskRoutes } from "./taskRoutes";
import { userRoutes } from "./userRoutes";

export const apiRouter = Router();

apiRouter.use("/activity-logs", activityLogRoutes);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/dashboard", dashboardRoutes);
apiRouter.use("/departments", departmentRoutes);
apiRouter.use("/employees", employeeRoutes);
apiRouter.use("/evaluations", evaluationRoutes);
apiRouter.use("/kpis", kpiRoutes);
apiRouter.use("/learning-pathways/assignments", learningPathwayAssignmentRoutes);
apiRouter.use("/learning-pathways/progress", learningPathwayProgressRoutes);
apiRouter.use("/learning-pathways/submissions", learningPathwaySubmissionRoutes);
apiRouter.use("/recommendations", recommendationRoutes);
apiRouter.use("/notifications", notificationRoutes);
apiRouter.use("/reports", reportRoutes);
apiRouter.use("/settings", settingsRoutes);
apiRouter.use("/tasks", taskRoutes);
apiRouter.use("/users", userRoutes);
