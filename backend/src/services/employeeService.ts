import bcrypt from "bcryptjs";

import { roles } from "../constants/roles";
import { withTransaction } from "../database/transaction";
import { createActivityLog } from "../repositories/activityLogRepository";
import { findDepartmentById } from "../repositories/departmentRepository";
import {
  createEmployee as createEmployeeRecord,
  findEmployeeByCode,
  findEmployeeById,
  findEmployeeByUserId,
  listEmployeeEvaluationHistory,
  listEmployees as listEmployeeRows,
  updateEmployee as updateEmployeeRecord
} from "../repositories/employeeRepository";
import { createUser, deleteUserById, findUserByEmail, updateUserBasicDetails } from "../repositories/userRepository";
import type { AuthenticatedUser } from "../types/domain";
import { ApiError } from "../utils/ApiError";
import { validateEmployeeCreateInput, validateEmployeeUpdateInput } from "../validators/employeeValidators";
import { summarizeEvaluationOutcome } from "./recommendationService";

export async function listEmployees(input?: {
  q?: string;
  status?: string;
  departmentId?: number;
  page?: number;
  pageSize?: number;
}) {
  const { items, total } = await listEmployeeRows(input);

  return {
    items: items.map((employee) => ({
      ...employee,
      latestEvaluationSummary:
        employee.latestTotalScore === null
          ? null
          : summarizeEvaluationOutcome({
              id: 0,
              employeeId: employee.id,
              evaluatorId: 0,
              evaluationDate: employee.hireDate,
              totalScore: Number(employee.latestTotalScore),
              performanceLevel: employee.latestPerformanceLevel as
                | "excellent"
                | "very_good"
                | "good"
                | "average"
                | "poor",
              recommendation: "",
              remarks: "",
              evidence: "",
              aiSummary: "",
              evaluationMode: "ai",
              trend: (employee.latestTrend ?? "stable") as "improving" | "stable" | "declining"
            })
    })),
    total
  };
}

export async function getEmployeeProfile(employeeId: number, requester: AuthenticatedUser) {
  const employee = await findEmployeeById(employeeId);

  if (!employee) {
    return null;
  }

  if (requester.role === roles.employee && requester.id !== employee.userId) {
    throw new ApiError(403, "Employees can only view their own records.");
  }

  const history = await listEmployeeEvaluationHistory(employee.id);

  return {
    ...employee,
    evaluationHistory: history
  };
}

export async function createEmployee(
  input: Parameters<typeof validateEmployeeCreateInput>[0],
  actor?: AuthenticatedUser
) {
  const payload = validateEmployeeCreateInput(input);
  const existingUser = await findUserByEmail(payload.email);

  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists.");
  }

  const existingEmployee = await findEmployeeByCode(payload.employeeCode);

  if (existingEmployee) {
    throw new ApiError(409, "This employee code is already in use.");
  }

  const department = await findDepartmentById(payload.departmentId);

  if (!department) {
    throw new ApiError(404, "Selected department was not found.");
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const employeeId = await withTransaction(async (connection) => {
    const userId = await createUser(connection, {
      fullName: payload.fullName,
      email: payload.email,
      password: hashedPassword,
      role: roles.employee,
      mustChangePassword: true
    });

    const nextEmployeeId = await createEmployeeRecord(connection, {
      userId,
      employeeCode: payload.employeeCode,
      departmentId: payload.departmentId,
      position: payload.position,
      hireDate: payload.hireDate,
      status: payload.status
    });

    await createActivityLog(connection, {
      userId: actor?.id ?? userId,
      action: `Created employee record ${payload.employeeCode}.`
    });

    return nextEmployeeId;
  });

  return getEmployeeProfile(employeeId, {
    id: 0,
    role: roles.admin,
    email: ""
  });
}

export async function updateEmployee(
  employeeId: number,
  input: Parameters<typeof validateEmployeeUpdateInput>[0],
  actor?: AuthenticatedUser
) {
  const payload = validateEmployeeUpdateInput(input);
  const employee = await findEmployeeById(employeeId);

  if (!employee) {
    throw new ApiError(404, "Employee not found.");
  }

  const department = await findDepartmentById(payload.departmentId);

  if (!department) {
    throw new ApiError(404, "Selected department was not found.");
  }

  const existingUser = await findUserByEmail(payload.email);

  if (existingUser && existingUser.id !== employee.userId) {
    throw new ApiError(409, "Another user already uses this email address.");
  }

  await withTransaction(async (connection) => {
    await updateUserBasicDetails(connection, employee.userId, {
      fullName: payload.fullName,
      email: payload.email
    });

    await updateEmployeeRecord(connection, employee.id, {
      departmentId: payload.departmentId,
      position: payload.position,
      hireDate: payload.hireDate,
      status: payload.status
    });

    await createActivityLog(connection, {
      userId: actor?.id ?? employee.userId,
      action: `Updated employee profile ${employee.employeeCode}.`
    });
  });

  return getEmployeeProfile(employeeId, {
    id: 0,
    role: roles.admin,
    email: ""
  });
}

export async function deleteEmployee(employeeId: number, actor?: AuthenticatedUser) {
  const employee = await findEmployeeById(employeeId);

  if (!employee) {
    throw new ApiError(404, "Employee not found.");
  }

  await withTransaction(async (connection) => {
    await createActivityLog(connection, {
      userId: actor?.id ?? employee.userId,
      action: `Deleted employee profile ${employee.employeeCode}.`
    });
    await deleteUserById(connection, employee.userId);
  });
}

export async function getEmployeeIdByUserId(userId: number) {
  const employee = await findEmployeeByUserId(userId);
  return employee?.id ?? null;
}
