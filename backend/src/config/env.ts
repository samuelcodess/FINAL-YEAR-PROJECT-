import type { SignOptions } from "jsonwebtoken";

function parseClientUrls() {
  const raw = process.env.CLIENT_URLS ?? process.env.CLIENT_URL ?? "";
  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (values.length > 0) {
    return values;
  }

  return [
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5175",
    "http://localhost:5173",
    "http://localhost:5175"
  ];
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  clientUrl: process.env.CLIENT_URL ?? "http://127.0.0.1:5173",
  clientUrls: parseClientUrls(),
  appName: process.env.APP_NAME ?? "PerformAI Hub",
  jwtSecret: process.env.JWT_SECRET ?? "change-me",
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? "1d") as SignOptions["expiresIn"],
  dbHost: process.env.DB_HOST ?? "127.0.0.1",
  dbPort: Number(process.env.DB_PORT ?? 3306),
  dbUser: process.env.DB_USER ?? "root",
  dbPassword: process.env.DB_PASSWORD ?? "",
  dbName: process.env.DB_NAME ?? "employee_performance_ai",
  aiServiceUrl: process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8000",
  aiServiceTimeoutMs: Number(process.env.AI_SERVICE_TIMEOUT_MS ?? 4000),
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPassword: process.env.SMTP_PASSWORD ?? "",
  smtpFromEmail: process.env.SMTP_FROM_EMAIL ?? "",
  smtpFromName: process.env.SMTP_FROM_NAME ?? process.env.APP_NAME ?? "PerformAI Hub"
};
