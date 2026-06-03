import { Router } from "express";

import { listActivityLogsController } from "../controllers/activityLogController";
import { roles } from "../constants/roles";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

export const activityLogRoutes = Router();

activityLogRoutes.get("/", authenticate, authorize(roles.admin), listActivityLogsController);
