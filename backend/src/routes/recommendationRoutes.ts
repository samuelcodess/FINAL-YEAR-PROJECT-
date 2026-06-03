import { Router } from "express";

import { listRecommendationsController } from "../controllers/recommendationController";
import { roles } from "../constants/roles";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

export const recommendationRoutes = Router();

recommendationRoutes.get(
  "/",
  authenticate,
  authorize(roles.admin, roles.hrManager, roles.employee),
  listRecommendationsController
);
