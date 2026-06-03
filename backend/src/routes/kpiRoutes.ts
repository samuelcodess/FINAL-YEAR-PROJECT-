import { Router } from "express";

import {
  createKpiController,
  deleteKpiController,
  listKpisController,
  updateKpiController
} from "../controllers/kpiController";
import { roles } from "../constants/roles";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

export const kpiRoutes = Router();

kpiRoutes.post("/", authenticate, authorize(roles.admin, roles.hrManager), createKpiController);
kpiRoutes.get("/", authenticate, authorize(roles.admin, roles.hrManager), listKpisController);
kpiRoutes.put("/:kpiId", authenticate, authorize(roles.admin, roles.hrManager), updateKpiController);
kpiRoutes.delete("/:kpiId", authenticate, authorize(roles.admin, roles.hrManager), deleteKpiController);
