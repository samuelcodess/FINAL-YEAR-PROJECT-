import { ApiError } from "../utils/ApiError";

const validStatuses = new Set(["active", "on_leave", "inactive", "terminated"]);

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

export type EmployeeCreateInput = {
  fullName: string;
  email: string;
  employeeCode: string;
  departmentId: number;
  position: string;
  hireDate: string;
  status: string;
  password: string;
};

export type EmployeeUpdateInput = Omit<EmployeeCreateInput, "employeeCode" | "password">;

export function validateEmployeeCreateInput(input: Partial<EmployeeCreateInput>): EmployeeCreateInput {
  if (!input.fullName?.trim()) {
    throw new ApiError(400, "Full name is required.");
  }

  if (!input.email?.trim() || !isValidEmail(input.email)) {
    throw new ApiError(400, "A valid email address is required.");
  }

  if (!input.employeeCode?.trim()) {
    throw new ApiError(400, "Employee code is required.");
  }

  if (!input.departmentId || input.departmentId < 1) {
    throw new ApiError(400, "A valid department is required.");
  }

  if (!input.position?.trim()) {
    throw new ApiError(400, "Position is required.");
  }

  if (!input.hireDate || !isValidDate(input.hireDate)) {
    throw new ApiError(400, "A valid hire date is required.");
  }

  if (!input.status || !validStatuses.has(input.status)) {
    throw new ApiError(400, "A valid employee status is required.");
  }

  if (!input.password || input.password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long.");
  }

  return {
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    employeeCode: input.employeeCode.trim(),
    departmentId: Number(input.departmentId),
    position: input.position.trim(),
    hireDate: input.hireDate,
    status: input.status,
    password: input.password
  };
}

export function validateEmployeeUpdateInput(input: Partial<EmployeeUpdateInput>): EmployeeUpdateInput {
  if (!input.fullName?.trim()) {
    throw new ApiError(400, "Full name is required.");
  }

  if (!input.email?.trim() || !isValidEmail(input.email)) {
    throw new ApiError(400, "A valid email address is required.");
  }

  if (!input.departmentId || input.departmentId < 1) {
    throw new ApiError(400, "A valid department is required.");
  }

  if (!input.position?.trim()) {
    throw new ApiError(400, "Position is required.");
  }

  if (!input.hireDate || !isValidDate(input.hireDate)) {
    throw new ApiError(400, "A valid hire date is required.");
  }

  if (!input.status || !validStatuses.has(input.status)) {
    throw new ApiError(400, "A valid employee status is required.");
  }

  return {
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    departmentId: Number(input.departmentId),
    position: input.position.trim(),
    hireDate: input.hireDate,
    status: input.status
  };
}
