import bcrypt from "bcryptjs";
import crypto from "node:crypto";

import { roles } from "../constants/roles";
import { withTransaction } from "../database/transaction";
import { createActivityLog } from "../repositories/activityLogRepository";
import { findDepartmentById } from "../repositories/departmentRepository";
import { createEmployee, findEmployeeByCode, findEmployeeByUserId } from "../repositories/employeeRepository";
import { createNotification } from "../repositories/notificationRepository";
import {
  createPasswordResetToken,
  findActivePasswordResetToken,
  markPasswordResetTokenUsed
} from "../repositories/passwordResetRepository";
import { createUser, findUserByEmail, updateUserPassword } from "../repositories/userRepository";
import { isEmailDeliveryConfigured, sendPasswordResetEmail } from "./emailService";
import { getBooleanSystemSetting } from "./settingsService";
import { ApiError } from "../utils/ApiError";
import { signToken } from "../utils/jwt";

export async function login(email: string, password: string) {
  const user = await findUserByEmail(email.toLowerCase());

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const employeeProfile = await findEmployeeByUserId(user.id);
  const token = signToken({
    sub: user.id,
    role: user.role,
    email: user.email
  });

  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword
    },
    employeeProfile
  };
}

export async function register(input: {
  fullName?: string;
  email?: string;
  password?: string;
  employeeCode?: string;
  departmentId?: number;
  position?: string;
  hireDate?: string;
}) {
  const selfRegistrationAllowed = await getBooleanSystemSetting("allow_self_registration", true);

  if (!selfRegistrationAllowed) {
    throw new ApiError(403, "Self-registration is currently disabled by the administrator.");
  }

  const fullName = input.fullName?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";
  const password = input.password ?? "";
  const employeeCode = input.employeeCode?.trim() ?? "";
  const departmentId = Number(input.departmentId);
  const position = input.position?.trim() ?? "";
  const hireDate = input.hireDate ?? "";

  if (!fullName || !email || !password || !employeeCode || !departmentId || !position || !hireDate) {
    throw new ApiError(400, "All registration fields are required.");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long.");
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists.");
  }

  const existingEmployee = await findEmployeeByCode(employeeCode);
  if (existingEmployee) {
    throw new ApiError(409, "This employee code is already in use.");
  }

  const department = await findDepartmentById(departmentId);
  if (!department) {
    throw new ApiError(404, "Selected department was not found.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const userId = await withTransaction(async (connection) => {
    const nextUserId = await createUser(connection, {
        fullName,
        email,
        password: hashedPassword,
        role: roles.employee,
        mustChangePassword: false
      });

    await createEmployee(connection, {
      userId: nextUserId,
      employeeCode,
      departmentId,
      position,
      hireDate,
      status: "active"
    });

    await createActivityLog(connection, {
      userId: nextUserId,
      action: "Registered a new employee account."
    });

    return nextUserId;
  });

  const employeeProfile = await findEmployeeByUserId(userId);
  const token = signToken({
    sub: userId,
    role: roles.employee,
    email
  });

  return {
    token,
    user: {
      id: userId,
      fullName,
      email,
      role: roles.employee,
      mustChangePassword: false
    },
    employeeProfile
  };
}

export async function initiatePasswordReset(email: string) {
  if (!isEmailDeliveryConfigured()) {
    throw new ApiError(
      503,
      "Password recovery email is not configured right now. Please contact an administrator to reset your password."
    );
  }

  const user = await findUserByEmail(email.trim().toLowerCase());

  if (!user) {
    return {
      message: "If the account exists, password reset instructions have been sent to the registered email address."
    };
  }

  const rawToken = crypto.randomBytes(24).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await withTransaction(async (connection) => {
    await createPasswordResetToken(connection, {
      userId: user.id,
      tokenHash,
      expiresAt
    });

    await createNotification(connection, {
      userId: user.id,
      category: "security",
      title: "Password reset requested",
      message: "A password reset token was issued for your account."
    });

    await createActivityLog(connection, {
      userId: user.id,
      action: "Requested password reset."
    });
  });

  await sendPasswordResetEmail({
    recipientEmail: user.email,
    recipientName: user.fullName,
    resetToken: rawToken
  });

  return {
    message: "If the account exists, password reset instructions have been sent to the registered email address."
  };
}

export async function resetPassword(input: { token?: string; password?: string }) {
  const token = input.token?.trim() ?? "";
  const password = input.password ?? "";

  if (!token || !password) {
    throw new ApiError(400, "Reset token and new password are required.");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long.");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const resetRecord = await findActivePasswordResetToken(tokenHash);

  if (!resetRecord) {
    throw new ApiError(400, "Reset token is invalid or expired.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await withTransaction(async (connection) => {
    await updateUserPassword(connection, resetRecord.userId, hashedPassword);
    await markPasswordResetTokenUsed(connection, resetRecord.id);
    await createActivityLog(connection, {
      userId: resetRecord.userId,
      action: "Reset account password."
    });
  });

  return {
    message: "Password reset completed successfully."
  };
}

export async function changePassword(
  actor: { id: number; email: string },
  input: { currentPassword?: string; newPassword?: string }
) {
  const currentPassword = input.currentPassword ?? "";
  const newPassword = input.newPassword ?? "";

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required.");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters long.");
  }

  const user = await findUserByEmail(actor.email.toLowerCase());

  if (!user) {
    throw new ApiError(404, "User account not found.");
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.password);

  if (!passwordMatches) {
    throw new ApiError(401, "Current password is incorrect.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await withTransaction(async (connection) => {
    await updateUserPassword(connection, user.id, hashedPassword, false);
    await createActivityLog(connection, {
      userId: user.id,
      action: "Changed account password."
    });
  });

  return {
    message: "Password changed successfully.",
    mustChangePassword: false
  };
}
