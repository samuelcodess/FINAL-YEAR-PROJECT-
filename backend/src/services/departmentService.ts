import { withTransaction } from "../database/transaction";
import { createActivityLog } from "../repositories/activityLogRepository";
import {
  createDepartment,
  deleteDepartment,
  findDepartmentById,
  listDepartments,
  updateDepartment
} from "../repositories/departmentRepository";
import type { AuthenticatedUser } from "../types/domain";
import { ApiError } from "../utils/ApiError";

function normalizeDepartmentName(name?: string) {
  const trimmed = name?.trim() ?? "";

  if (!trimmed) {
    throw new ApiError(400, "Department name is required.");
  }

  return trimmed;
}

export async function getDepartments() {
  return listDepartments();
}

export async function createDepartmentRecord(name: string, user: AuthenticatedUser) {
  const departmentName = normalizeDepartmentName(name);

  const departmentId = await withTransaction(async (connection) => {
    const id = await createDepartment(connection, departmentName);
    await createActivityLog(connection, {
      userId: user.id,
      action: `Created department "${departmentName}".`
    });
    return id;
  });

  return findDepartmentById(departmentId);
}

export async function updateDepartmentRecord(departmentId: number, name: string, user: AuthenticatedUser) {
  const departmentName = normalizeDepartmentName(name);
  const existing = await findDepartmentById(departmentId);

  if (!existing) {
    throw new ApiError(404, "Department not found.");
  }

  await withTransaction(async (connection) => {
    await updateDepartment(connection, departmentId, departmentName);
    await createActivityLog(connection, {
      userId: user.id,
      action: `Updated department "${existing.departmentName}" to "${departmentName}".`
    });
  });

  return findDepartmentById(departmentId);
}

export async function deleteDepartmentRecord(departmentId: number, user: AuthenticatedUser) {
  const existing = await findDepartmentById(departmentId);

  if (!existing) {
    throw new ApiError(404, "Department not found.");
  }

  await withTransaction(async (connection) => {
    await deleteDepartment(connection, departmentId);
    await createActivityLog(connection, {
      userId: user.id,
      action: `Deleted department "${existing.departmentName}".`
    });
  });
}
