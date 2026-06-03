import bcrypt from "bcryptjs";
import crypto from "node:crypto";

import { roles, type AppRole } from "../constants/roles";
import { withTransaction } from "../database/transaction";
import { createActivityLog } from "../repositories/activityLogRepository";
import {
  createUser,
  deleteUserById,
  findUserByEmail,
  findUserById,
  listUsers as listUserRows,
  updateUserBasicDetails,
  updateUserPassword,
  updateUserRole
} from "../repositories/userRepository";
import type { AuthenticatedUser } from "../types/domain";
import { ApiError } from "../utils/ApiError";

function sanitizeUser(user: Awaited<ReturnType<typeof findUserById>>) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt
  };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function listUsers(input: {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: AppRole | "";
}) {
  const page = Math.max(Number(input.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(input.pageSize ?? 10), 1), 50);

  return listUserRows({
    page,
    pageSize,
    q: input.q,
    role: input.role ?? ""
  });
}

export async function createPlatformUser(
  input: {
    fullName?: string;
    email?: string;
    password?: string;
    role?: AppRole;
  },
  actor: AuthenticatedUser
) {
  const fullName = input.fullName?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";
  const password = input.password ?? "";
  const role = input.role ?? roles.hrManager;

  if (!fullName) {
    throw new ApiError(400, "Full name is required.");
  }

  if (!email || !isValidEmail(email)) {
    throw new ApiError(400, "A valid email address is required.");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Temporary password must be at least 8 characters long.");
  }

  if (role !== roles.admin && role !== roles.hrManager) {
    throw new ApiError(400, "Use the employee module to create employee accounts.");
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const userId = await withTransaction(async (connection) => {
    const createdUserId = await createUser(connection, {
      fullName,
      email,
      password: hashedPassword,
      role,
      mustChangePassword: true
    });

    await createActivityLog(connection, {
      userId: actor.id,
      action: `Created ${role} account ${email}.`
    });

    return createdUserId;
  });

  return sanitizeUser(await findUserById(userId));
}

export async function changeUserRole(
  userId: number,
  nextRole: AppRole,
  actor: AuthenticatedUser
) {
  if (!Object.values(roles).includes(nextRole)) {
    throw new ApiError(400, "A valid role is required.");
  }

  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (user.id === actor.id) {
    throw new ApiError(400, "You cannot change your own role.");
  }

  await withTransaction(async (connection) => {
    await updateUserRole(connection, userId, nextRole);
    await createActivityLog(connection, {
      userId: actor.id,
      action: `Changed role for ${user.email} from ${user.role} to ${nextRole}.`
    });
  });

  return sanitizeUser(await findUserById(userId));
}

export async function deleteUserAccount(userId: number, actor: AuthenticatedUser) {
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (user.id === actor.id) {
    throw new ApiError(400, "You cannot delete your own account.");
  }

  await withTransaction(async (connection) => {
    await deleteUserById(connection, userId);
    await createActivityLog(connection, {
      userId: actor.id,
      action: `Deleted user account ${user.email}.`
    });
  });
}

export async function resetUserPassword(userId: number, actor: AuthenticatedUser) {
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (user.id === actor.id) {
    throw new ApiError(400, "Use your own password change screen instead of admin reset.");
  }

  const temporaryPassword = `Temp-${crypto.randomBytes(4).toString("hex")}`;
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  await withTransaction(async (connection) => {
    await updateUserPassword(connection, user.id, hashedPassword, true);
    await createActivityLog(connection, {
      userId: actor.id,
      action: `Reset password for ${user.email}.`
    });
  });

  return {
    user: sanitizeUser(await findUserById(user.id)),
    temporaryPassword
  };
}

export async function updateOwnProfile(
  actor: AuthenticatedUser,
  input: {
    fullName?: string;
    email?: string;
  }
) {
  const fullName = input.fullName?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";

  if (!fullName || !email) {
    throw new ApiError(400, "Full name and email are required.");
  }

  const existing = await findUserByEmail(email);
  if (existing && existing.id !== actor.id) {
    throw new ApiError(409, "Another user already uses this email address.");
  }

  await withTransaction(async (connection) => {
    await updateUserBasicDetails(connection, actor.id, {
      fullName,
      email
    });
    await createActivityLog(connection, {
      userId: actor.id,
      action: "Updated personal profile details."
    });
  });

  return sanitizeUser(await findUserById(actor.id));
}
