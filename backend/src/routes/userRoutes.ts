import { Router } from "express";

import {
  createUserController,
  deleteUserController,
  listUsersController,
  resetUserPasswordController,
  updateOwnProfileController,
  updateUserRoleController
} from "../controllers/userController";
import { roles } from "../constants/roles";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

export const userRoutes = Router();

userRoutes.put("/me", authenticate, updateOwnProfileController);
userRoutes.get("/", authenticate, authorize(roles.admin), listUsersController);
userRoutes.post("/", authenticate, authorize(roles.admin), createUserController);
userRoutes.put("/:userId/role", authenticate, authorize(roles.admin), updateUserRoleController);
userRoutes.post("/:userId/reset-password", authenticate, authorize(roles.admin), resetUserPasswordController);
userRoutes.delete("/:userId", authenticate, authorize(roles.admin), deleteUserController);
