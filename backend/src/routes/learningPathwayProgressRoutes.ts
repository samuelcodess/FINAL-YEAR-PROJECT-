import { Router } from "express";

import {
  getLearningPathwayProgressController,
  updateLearningPathwayProgressController
} from "../controllers/learningPathwayProgressController";
import { roles } from "../constants/roles";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

export const learningPathwayProgressRoutes = Router();

learningPathwayProgressRoutes.get(
  "/",
  authenticate,
  authorize(roles.admin, roles.hrManager, roles.employee),
  getLearningPathwayProgressController
);
learningPathwayProgressRoutes.put(
  "/",
  authenticate,
  authorize(roles.admin, roles.hrManager, roles.employee),
  updateLearningPathwayProgressController
);
