import { Router } from "express";

import {
  createTaskController,
  getTaskController,
  listTasksController,
  reviewTaskSubmissionController,
  submitTaskWorkController,
  updateTaskController,
  updateTaskProgressController
} from "../controllers/taskController";
import { roles } from "../constants/roles";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

export const taskRoutes = Router();

taskRoutes.get("/", authenticate, authorize(roles.admin, roles.hrManager, roles.employee), listTasksController);
taskRoutes.get("/:taskId", authenticate, authorize(roles.admin, roles.hrManager, roles.employee), getTaskController);
taskRoutes.post("/", authenticate, authorize(roles.admin, roles.hrManager), createTaskController);
taskRoutes.put("/:taskId", authenticate, authorize(roles.admin, roles.hrManager), updateTaskController);
taskRoutes.put(
  "/:taskId/progress",
  authenticate,
  authorize(roles.employee),
  updateTaskProgressController
);
taskRoutes.post("/:taskId/submissions", authenticate, authorize(roles.employee), submitTaskWorkController);
taskRoutes.put(
  "/:taskId/submissions/:submissionId/review",
  authenticate,
  authorize(roles.admin, roles.hrManager),
  reviewTaskSubmissionController
);
