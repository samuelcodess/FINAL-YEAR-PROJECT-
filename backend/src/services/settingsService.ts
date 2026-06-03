import { withTransaction } from "../database/transaction";
import { createActivityLog } from "../repositories/activityLogRepository";
import {
  getUserPreferences,
  listSystemSettings,
  upsertSystemSetting,
  upsertUserPreferences
} from "../repositories/settingsRepository";
import type { AuthenticatedUser } from "../types/domain";
import { ApiError } from "../utils/ApiError";

const defaultSystemSettings = {
  defaultPathwayDeadlineDays: 21,
  reminderLeadDays: 3,
  allowSelfRegistration: false
};

function mapSystemSettings(rows: Array<{ settingKey: string; settingValue: string }>) {
  const values = new Map(rows.map((row) => [row.settingKey, row.settingValue]));

  return {
    defaultPathwayDeadlineDays: Number(values.get("default_pathway_deadline_days") ?? defaultSystemSettings.defaultPathwayDeadlineDays),
    reminderLeadDays: Number(values.get("reminder_lead_days") ?? defaultSystemSettings.reminderLeadDays),
    allowSelfRegistration:
      (values.get("allow_self_registration") ?? String(defaultSystemSettings.allowSelfRegistration)) === "true"
  };
}

export async function getSettingsForUser(actor: AuthenticatedUser) {
  const preferences = (await getUserPreferences(actor.id)) ?? {
    userId: actor.id,
    themePreference: "light" as const,
    emailNotifications: true,
    inAppNotifications: true,
    reminderOptIn: true,
    updatedAt: new Date().toISOString()
  };

  const response: {
    userPreferences: typeof preferences;
    systemSettings?: ReturnType<typeof mapSystemSettings>;
  } = {
    userPreferences: preferences
  };

  if (actor.role === "admin") {
    response.systemSettings = mapSystemSettings(await listSystemSettings());
  }

  return response;
}

export async function updateOwnPreferences(
  actor: AuthenticatedUser,
  input: {
    themePreference?: "light" | "dark" | "system";
    emailNotifications?: boolean;
    inAppNotifications?: boolean;
    reminderOptIn?: boolean;
  }
) {
  const themePreference = input.themePreference ?? "light";

  if (!["light", "dark", "system"].includes(themePreference)) {
    throw new ApiError(400, "Theme preference must be light, dark, or system.");
  }

  await withTransaction(async (connection) => {
    await upsertUserPreferences(connection, {
      userId: actor.id,
      themePreference,
      emailNotifications: Boolean(input.emailNotifications),
      inAppNotifications: Boolean(input.inAppNotifications),
      reminderOptIn: Boolean(input.reminderOptIn)
    });

    await createActivityLog(connection, {
      userId: actor.id,
      action: "Updated personal preferences."
    });
  });

  return getSettingsForUser(actor);
}

export async function updateSystemSettings(
  actor: AuthenticatedUser,
  input: {
    defaultPathwayDeadlineDays?: number;
    reminderLeadDays?: number;
    allowSelfRegistration?: boolean;
  }
) {
  if (actor.role !== "admin") {
    throw new ApiError(403, "Only administrators can update platform settings.");
  }

  const defaultPathwayDeadlineDays = Number(input.defaultPathwayDeadlineDays);
  const reminderLeadDays = Number(input.reminderLeadDays);
  const allowSelfRegistration = Boolean(input.allowSelfRegistration);

  if (!Number.isInteger(defaultPathwayDeadlineDays) || defaultPathwayDeadlineDays < 1 || defaultPathwayDeadlineDays > 180) {
    throw new ApiError(400, "Default pathway deadline days must be between 1 and 180.");
  }

  if (!Number.isInteger(reminderLeadDays) || reminderLeadDays < 0 || reminderLeadDays > 30) {
    throw new ApiError(400, "Reminder lead days must be between 0 and 30.");
  }

  await withTransaction(async (connection) => {
    await upsertSystemSetting(connection, {
      settingKey: "default_pathway_deadline_days",
      settingValue: String(defaultPathwayDeadlineDays)
    });
    await upsertSystemSetting(connection, {
      settingKey: "reminder_lead_days",
      settingValue: String(reminderLeadDays)
    });
    await upsertSystemSetting(connection, {
      settingKey: "allow_self_registration",
      settingValue: String(allowSelfRegistration)
    });

    await createActivityLog(connection, {
      userId: actor.id,
      action: "Updated platform settings."
    });
  });

  return getSettingsForUser(actor);
}

export async function getNumberSystemSetting(settingKey: "default_pathway_deadline_days" | "reminder_lead_days", fallback: number) {
  const rows = await listSystemSettings([settingKey]);
  const value = Number(rows[0]?.settingValue ?? fallback);

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return value;
}

export async function getBooleanSystemSetting(settingKey: "allow_self_registration", fallback: boolean) {
  const rows = await listSystemSettings([settingKey]);
  const raw = rows[0]?.settingValue;

  if (raw === undefined) {
    return fallback;
  }

  return raw === "true";
}
