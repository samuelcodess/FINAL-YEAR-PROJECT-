import type { PoolConnection } from "mysql2/promise";

import { pool } from "../database/pool";

export type UserPreferenceRow = {
  userId: number;
  themePreference: "light" | "dark" | "system";
  emailNotifications: boolean;
  inAppNotifications: boolean;
  reminderOptIn: boolean;
  updatedAt: string;
};

export async function getUserPreferences(userId: number) {
  const [rows] = await pool.query(
    `SELECT
       user_id AS userId,
       theme_preference AS themePreference,
       email_notifications AS emailNotifications,
       in_app_notifications AS inAppNotifications,
       reminder_opt_in AS reminderOptIn,
       DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updatedAt
     FROM user_preferences
     WHERE user_id = ?`,
    [userId]
  );

  return (rows as UserPreferenceRow[])[0] ?? null;
}

export async function upsertUserPreferences(
  connection: PoolConnection,
  input: {
    userId: number;
    themePreference: "light" | "dark" | "system";
    emailNotifications: boolean;
    inAppNotifications: boolean;
    reminderOptIn: boolean;
  }
) {
  await connection.execute(
    `INSERT INTO user_preferences (
       user_id,
       theme_preference,
       email_notifications,
       in_app_notifications,
       reminder_opt_in
     ) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       theme_preference = VALUES(theme_preference),
       email_notifications = VALUES(email_notifications),
       in_app_notifications = VALUES(in_app_notifications),
       reminder_opt_in = VALUES(reminder_opt_in)`,
    [
      input.userId,
      input.themePreference,
      input.emailNotifications,
      input.inAppNotifications,
      input.reminderOptIn
    ]
  );
}

export async function listSystemSettings(keys?: string[]) {
  if (keys && keys.length > 0) {
    const placeholders = keys.map(() => "?").join(", ");
    const [rows] = await pool.query(
      `SELECT
         setting_key AS settingKey,
         setting_value AS settingValue,
         DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updatedAt
       FROM system_settings
       WHERE setting_key IN (${placeholders})`,
      keys
    );

    return rows as Array<{
      settingKey: string;
      settingValue: string;
      updatedAt: string;
    }>;
  }

  const [rows] = await pool.query(
    `SELECT
       setting_key AS settingKey,
       setting_value AS settingValue,
       DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updatedAt
     FROM system_settings`
  );

  return rows as Array<{
    settingKey: string;
    settingValue: string;
    updatedAt: string;
  }>;
}

export async function upsertSystemSetting(
  connection: PoolConnection,
  input: {
    settingKey: string;
    settingValue: string;
  }
) {
  await connection.execute(
    `INSERT INTO system_settings (setting_key, setting_value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [input.settingKey, input.settingValue]
  );
}
