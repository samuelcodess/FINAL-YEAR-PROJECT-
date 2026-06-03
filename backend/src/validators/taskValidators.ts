import type { TaskPriority, TaskStatus } from "../types/domain";
import { ApiError } from "../utils/ApiError";

const validPriorities = new Set<TaskPriority>(["low", "medium", "high"]);
const validStatuses = new Set<TaskStatus>([
  "not_started",
  "in_progress",
  "submitted",
  "completed",
  "needs_revision",
  "cancelled"
]);

function isValidDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

export function validateTaskCreateInput(input: {
  employeeId?: number;
  title?: string;
  description?: string;
  linkedKpiId?: number | null;
  priority?: TaskPriority;
  dueDate?: string | null;
}) {
  const title = input.title?.trim() ?? "";
  const description = input.description?.trim() ?? "";
  const employeeId = Number(input.employeeId);
  const linkedKpiId =
    input.linkedKpiId === null || input.linkedKpiId === undefined || input.linkedKpiId === 0
      ? null
      : Number(input.linkedKpiId);
  const priority = input.priority ?? "medium";
  const dueDate = input.dueDate?.trim() ? input.dueDate.trim() : null;

  if (!employeeId || employeeId < 1) {
    throw new ApiError(400, "A valid employee is required.");
  }

  if (!title) {
    throw new ApiError(400, "Task title is required.");
  }

  if (!description) {
    throw new ApiError(400, "Task description is required.");
  }

  if (!validPriorities.has(priority)) {
    throw new ApiError(400, "Task priority must be low, medium, or high.");
  }

  if (dueDate && !isValidDate(dueDate)) {
    throw new ApiError(400, "A valid due date is required.");
  }

  return {
    employeeId,
    title,
    description,
    linkedKpiId,
    priority,
    dueDate
  };
}

export function validateTaskUpdateInput(input: {
  title?: string;
  description?: string;
  linkedKpiId?: number | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  status?: TaskStatus;
}) {
  const title = input.title?.trim() ?? "";
  const description = input.description?.trim() ?? "";
  const linkedKpiId =
    input.linkedKpiId === null || input.linkedKpiId === undefined || input.linkedKpiId === 0
      ? null
      : Number(input.linkedKpiId);
  const priority = input.priority ?? "medium";
  const dueDate = input.dueDate?.trim() ? input.dueDate.trim() : null;
  const status = input.status ?? "not_started";

  if (!title) {
    throw new ApiError(400, "Task title is required.");
  }

  if (!description) {
    throw new ApiError(400, "Task description is required.");
  }

  if (!validPriorities.has(priority)) {
    throw new ApiError(400, "Task priority must be low, medium, or high.");
  }

  if (!validStatuses.has(status)) {
    throw new ApiError(400, "Task status is invalid.");
  }

  if (dueDate && !isValidDate(dueDate)) {
    throw new ApiError(400, "A valid due date is required.");
  }

  return {
    title,
    description,
    linkedKpiId,
    priority,
    dueDate,
    status
  };
}
