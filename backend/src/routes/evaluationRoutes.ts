import { Router } from "express";

import {
  createEvaluationController,
  listEvaluationsController
} from "../controllers/evaluationController";
import { roles } from "../constants/roles";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

export const evaluationRoutes = Router();

evaluationRoutes.get(
  "/",
  authenticate,
  authorize(roles.admin, roles.hrManager, roles.employee),
  listEvaluationsController
);
evaluationRoutes.post("/", authenticate, authorize(roles.admin, roles.hrManager), createEvaluationController);
