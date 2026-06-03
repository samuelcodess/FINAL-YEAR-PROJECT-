import { Router } from "express";

import {
  createEmployeeController,
  deleteEmployeeController,
  getEmployeeController,
  listEmployeesController,
  updateEmployeeController
} from "../controllers/employeeController";
import { roles } from "../constants/roles";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

export const employeeRoutes = Router();

employeeRoutes.post("/", authenticate, authorize(roles.admin), createEmployeeController);
employeeRoutes.get("/", authenticate, authorize(roles.admin, roles.hrManager), listEmployeesController);
employeeRoutes.get(
  "/:employeeId",
  authenticate,
  authorize(roles.admin, roles.hrManager, roles.employee),
  getEmployeeController
);
employeeRoutes.put("/:employeeId", authenticate, authorize(roles.admin, roles.hrManager), updateEmployeeController);
employeeRoutes.delete(
  "/:employeeId",
  authenticate,
  authorize(roles.admin),
  deleteEmployeeController
);
