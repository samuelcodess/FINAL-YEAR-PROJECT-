import { Router } from "express";

import {
  getLearningPathwayAssignmentController,
  updateLearningPathwayAssignmentController
} from "../controllers/learningPathwayAssignmentController";
import { roles } from "../constants/roles";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

export const learningPathwayAssignmentRoutes = Router();

learningPathwayAssignmentRoutes.get(
  "/",
  authenticate,
  authorize(roles.admin, roles.hrManager, roles.employee),
  getLearningPathwayAssignmentController
);

learningPathwayAssignmentRoutes.put(
  "/:assignmentId",
  authenticate,
  authorize(roles.hrManager),
  updateLearningPathwayAssignmentController
);
