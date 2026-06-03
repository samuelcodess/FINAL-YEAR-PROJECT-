import { Router } from "express";

import {
  adminDashboardController,
  employeeDashboardController,
  hrDashboardController
} from "../controllers/dashboardController";
import { roles } from "../constants/roles";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

export const dashboardRoutes = Router();

dashboardRoutes.get("/admin", authenticate, authorize(roles.admin), adminDashboardController);
dashboardRoutes.get("/hr", authenticate, authorize(roles.admin, roles.hrManager), hrDashboardController);
dashboardRoutes.get(
  "/employee",
  authenticate,
  authorize(roles.employee, roles.admin, roles.hrManager),
  employeeDashboardController
);
