import { Router } from "express";

import {
  changePasswordController,
  forgotPasswordController,
  loginController,
  meController,
  registerController,
  resetPasswordController
} from "../controllers/authController";
import { authenticate } from "../middleware/authenticate";

export const authRoutes = Router();

authRoutes.post("/login", loginController);
authRoutes.post("/register", registerController);
authRoutes.post("/forgot-password", forgotPasswordController);
authRoutes.post("/reset-password", resetPasswordController);
authRoutes.post("/change-password", authenticate, changePasswordController);
authRoutes.get("/me", authenticate, meController);
