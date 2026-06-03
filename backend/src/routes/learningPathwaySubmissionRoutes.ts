import { Router } from "express";

import {
  createLearningPathwaySubmissionController,
  listLearningPathwaySubmissionsController,
  reviewLearningPathwaySubmissionController
} from "../controllers/learningPathwaySubmissionController";
import { roles } from "../constants/roles";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

export const learningPathwaySubmissionRoutes = Router();

learningPathwaySubmissionRoutes.get(
  "/",
  authenticate,
  authorize(roles.admin, roles.hrManager, roles.employee),
  listLearningPathwaySubmissionsController
);

learningPathwaySubmissionRoutes.post(
  "/",
  authenticate,
  authorize(roles.employee),
  createLearningPathwaySubmissionController
);

learningPathwaySubmissionRoutes.put(
  "/:submissionId/review",
  authenticate,
  authorize(roles.hrManager),
  reviewLearningPathwaySubmissionController
);
