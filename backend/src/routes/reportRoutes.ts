import { Router } from "express";

import {
  exportExcelReportController,
  exportPdfReportController,
  reportsSummaryController
} from "../controllers/reportController";
import { roles } from "../constants/roles";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

export const reportRoutes = Router();

reportRoutes.get("/", authenticate, authorize(roles.admin, roles.hrManager), reportsSummaryController);
reportRoutes.get(
  "/export/pdf",
  authenticate,
  authorize(roles.admin, roles.hrManager),
  exportPdfReportController
);
reportRoutes.get(
  "/export/excel",
  authenticate,
  authorize(roles.admin, roles.hrManager),
  exportExcelReportController
);
