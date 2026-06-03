import { Router } from "express";

import {
  listNotificationsController,
  markAllNotificationsReadController,
  markNotificationCategoryReadController,
  notificationSummaryController,
  markNotificationReadController
} from "../controllers/notificationController";
import { authenticate } from "../middleware/authenticate";

export const notificationRoutes = Router();

notificationRoutes.get("/", authenticate, listNotificationsController);
notificationRoutes.get("/summary", authenticate, notificationSummaryController);
notificationRoutes.patch("/read-all", authenticate, markAllNotificationsReadController);
notificationRoutes.patch("/read-category/:category", authenticate, markNotificationCategoryReadController);
notificationRoutes.patch("/:notificationId/read", authenticate, markNotificationReadController);
