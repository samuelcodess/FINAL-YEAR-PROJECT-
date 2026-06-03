import { withTransaction } from "../database/transaction";
import { listActiveLearningPathwayAssignmentsWithDeadlines } from "../repositories/learningPathwayAssignmentRepository";
import { createNotification } from "../repositories/notificationRepository";
import { hasReminderBeenSent, createReminderLog } from "../repositories/reminderLogRepository";
import { getUserPreferences } from "../repositories/settingsRepository";
import { getNumberSystemSetting } from "./settingsService";

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysBetween(currentDate: Date, dueDate: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((dueDate.getTime() - currentDate.getTime()) / msPerDay);
}

async function shouldSendReminderToUser(userId: number) {
  const preferences = await getUserPreferences(userId);

  if (!preferences) {
    return true;
  }

  return Boolean(preferences.inAppNotifications) && Boolean(preferences.reminderOptIn);
}

export async function runLearningPathwayReminderCycle() {
  const assignments = await listActiveLearningPathwayAssignmentsWithDeadlines();
  const reminderLeadDays = await getNumberSystemSetting("reminder_lead_days", 3);
  const today = new Date();
  const todayKey = formatDateOnly(today);

  for (const assignment of assignments) {
    if (!assignment.dueDate) {
      continue;
    }

    const dueDate = new Date(`${assignment.dueDate}T00:00:00`);
    const dayDelta = daysBetween(today, dueDate);
    let reminderType: "due_soon" | "overdue" | null = null;

    if (dayDelta < 0) {
      reminderType = "overdue";
    } else if (dayDelta <= reminderLeadDays) {
      reminderType = "due_soon";
    }

    if (!reminderType) {
      continue;
    }

    const alreadySent = await hasReminderBeenSent({
      assignmentId: assignment.id,
      reminderType,
      reminderDate: todayKey
    });

    if (alreadySent) {
      continue;
    }

    if (!(await shouldSendReminderToUser(assignment.employeeUserId))) {
      continue;
    }

    const message =
      reminderType === "overdue"
        ? `Your learning pathway ${assignment.resourceId} is overdue. Please continue the assigned modules and submit evidence for review.`
        : `Your learning pathway ${assignment.resourceId} is due on ${assignment.dueDate}. Please complete the next steps before the deadline.`;

    await withTransaction(async (connection) => {
      await createNotification(connection, {
        userId: assignment.employeeUserId,
        category: "recommendation",
        title: reminderType === "overdue" ? "Learning pathway overdue" : "Learning pathway due soon",
        message
      });

      await createReminderLog(connection, {
        assignmentId: assignment.id,
        reminderType,
        reminderDate: todayKey
      });
    });
  }
}

let reminderInterval: NodeJS.Timeout | null = null;

export function startReminderScheduler() {
  if (reminderInterval) {
    return;
  }

  void runLearningPathwayReminderCycle().catch((error) => {
    console.error("Reminder cycle failed:", error);
  });

  reminderInterval = setInterval(() => {
    void runLearningPathwayReminderCycle().catch((error) => {
      console.error("Reminder cycle failed:", error);
    });
  }, 1000 * 60 * 30);
}
