import { Router } from "express";

import {
  getSettingsController,
  updateOwnPreferencesController,
  updateSystemSettingsController
} from "../controllers/settingsController";
import { roles } from "../constants/roles";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

export const settingsRoutes = Router();

settingsRoutes.get("/", authenticate, authorize(roles.admin, roles.hrManager, roles.employee), getSettingsController);
settingsRoutes.put(
  "/preferences",
  authenticate,
  authorize(roles.admin, roles.hrManager, roles.employee),
  updateOwnPreferencesController
);
settingsRoutes.put(
  "/system",
  authenticate,
  authorize(roles.admin),
  updateSystemSettingsController
);
