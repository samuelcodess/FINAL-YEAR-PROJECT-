import nodemailer from "nodemailer";

import { env } from "../config/env";

function buildTransporter() {
  if (!env.smtpHost || !env.smtpFromEmail) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth:
      env.smtpUser && env.smtpPassword
        ? {
            user: env.smtpUser,
            pass: env.smtpPassword
          }
        : undefined
  });
}

export function isEmailDeliveryConfigured() {
  return Boolean(buildTransporter());
}

export async function sendPasswordResetEmail(input: {
  recipientEmail: string;
  recipientName: string;
  resetToken: string;
}) {
  const transporter = buildTransporter();

  if (!transporter) {
    throw new Error("Email delivery is not configured.");
  }

  const resetUrl = `${env.clientUrl}/reset-password?token=${encodeURIComponent(input.resetToken)}`;

  await transporter.sendMail({
    from: `"${env.smtpFromName}" <${env.smtpFromEmail}>`,
    to: input.recipientEmail,
    subject: `${env.appName} password reset`,
    text: [
      `Hello ${input.recipientName},`,
      "",
      "A password reset was requested for your account.",
      `Use this reset token: ${input.resetToken}`,
      `Or open this reset link: ${resetUrl}`,
      "",
      "The token will expire in 30 minutes.",
      "If you did not request this, contact your administrator immediately."
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin-bottom: 8px;">${env.appName} password reset</h2>
        <p>Hello ${input.recipientName},</p>
        <p>A password reset was requested for your account.</p>
        <p>
          Use this reset token:
          <strong style="display: inline-block; margin-left: 6px;">${input.resetToken}</strong>
        </p>
        <p>
          Or open this reset link:
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p>The token will expire in 30 minutes.</p>
        <p>If you did not request this, contact your administrator immediately.</p>
      </div>
    `
  });
}
