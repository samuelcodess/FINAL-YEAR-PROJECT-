import { Router } from "express";

import {
  createDepartmentController,
  deleteDepartmentController,
  listDepartmentsController,
  updateDepartmentController
} from "../controllers/departmentController";
import { roles } from "../constants/roles";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

export const departmentRoutes = Router();

departmentRoutes.post(
  "/",
  authenticate,
  authorize(roles.admin, roles.hrManager),
  createDepartmentController
);
departmentRoutes.get("/", listDepartmentsController);
departmentRoutes.put(
  "/:departmentId",
  authenticate,
  authorize(roles.admin, roles.hrManager),
  updateDepartmentController
);
departmentRoutes.delete(
  "/:departmentId",
  authenticate,
  authorize(roles.admin),
  deleteDepartmentController
);
