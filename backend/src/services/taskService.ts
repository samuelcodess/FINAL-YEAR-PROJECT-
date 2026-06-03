import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { roles } from "../constants/roles";
import { withTransaction } from "../database/transaction";
import { createActivityLog } from "../repositories/activityLogRepository";
import { findEmployeeById, findEmployeeByUserId } from "../repositories/employeeRepository";
import { createNotification } from "../repositories/notificationRepository";
import { findKpiById } from "../repositories/kpiRepository";
import {
  createTask,
  findTaskById,
  listTasks as listTaskRows,
  updateTaskMetadata,
  updateTaskStatus
} from "../repositories/taskRepository";
import {
  createTaskSubmissionAttachment,
  listTaskSubmissionAttachments
} from "../repositories/taskSubmissionAttachmentRepository";
import {
  createTaskSubmission,
  findTaskSubmissionById,
  listTaskSubmissions,
  updateTaskSubmissionReview
} from "../repositories/taskSubmissionRepository";
import type { AuthenticatedUser, TaskPriority, TaskStatus, TaskSubmissionStatus } from "../types/domain";
import { ApiError } from "../utils/ApiError";
import { validateTaskCreateInput, validateTaskUpdateInput } from "../validators/taskValidators";

const taskUploadDirectory = path.join(process.cwd(), "uploads", "tasks");
const allowedAttachmentMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "image/png",
  "image/jpeg"
]);

function normalizeText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function formatDateTimeForSql(date = new Date()) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

async function resolveEmployeeIdForActor(actor: AuthenticatedUser) {
  const employee = await findEmployeeByUserId(actor.id);

  if (!employee) {
    throw new ApiError(404, "Employee profile not found for the signed-in user.");
  }

  return employee.id;
}

async function ensureTaskAccess(taskId: number, actor: AuthenticatedUser) {
  const task = await findTaskById(taskId);

  if (!task) {
    throw new ApiError(404, "Task not found.");
  }

  if (actor.role === roles.employee) {
    const employeeId = await resolveEmployeeIdForActor(actor);

    if (task.employeeId !== employeeId) {
      throw new ApiError(403, "Employees can only access their own assigned tasks.");
    }
  }

  return task;
}

async function buildTaskDetail(taskId: number) {
  const task = await findTaskById(taskId);

  if (!task) {
    return null;
  }

  const submissions = await listTaskSubmissions(taskId);
  const attachments = await listTaskSubmissionAttachments(submissions.map((submission) => submission.id));
  const attachmentMap = new Map<number, typeof attachments>();

  for (const attachment of attachments) {
    const current = attachmentMap.get(attachment.submissionId) ?? [];
    current.push(attachment);
    attachmentMap.set(attachment.submissionId, current);
  }

  return {
    ...task,
    submissions: submissions.map((submission) => ({
      ...submission,
      attachments: attachmentMap.get(submission.id) ?? []
    }))
  };
}

export async function listTasksForActor(
  actor: AuthenticatedUser,
  input: {
    q?: string;
    status?: string;
    scope?: string;
    page?: number;
    pageSize?: number;
  }
) {
  const page = Math.max(Number(input.page ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(input.pageSize ?? 10), 1), 50);
  const employeeId = actor.role === roles.employee ? await resolveEmployeeIdForActor(actor) : undefined;

  return listTaskRows({
    employeeId,
    q: input.q,
    status: input.status,
    scope: input.scope,
    page,
    pageSize
  });
}

export async function getTaskForActor(taskId: number, actor: AuthenticatedUser) {
  await ensureTaskAccess(taskId, actor);
  return buildTaskDetail(taskId);
}

export async function createTaskForEmployee(
  actor: AuthenticatedUser,
  input: {
    employeeId?: number;
    title?: string;
    description?: string;
    linkedKpiId?: number | null;
    priority?: TaskPriority;
    dueDate?: string | null;
  }
) {
  if (actor.role !== roles.admin && actor.role !== roles.hrManager) {
    throw new ApiError(403, "Only administrators and HR managers can assign tasks.");
  }

  const payload = validateTaskCreateInput(input);
  const employee = await findEmployeeById(payload.employeeId);

  if (!employee) {
    throw new ApiError(404, "Employee not found.");
  }

  if (payload.linkedKpiId !== null) {
    const kpi = await findKpiById(payload.linkedKpiId);

    if (!kpi) {
      throw new ApiError(404, "Linked KPI was not found.");
    }
  }

  const taskId = await withTransaction(async (connection) => {
    const createdTaskId = await createTask(connection, {
      employeeId: payload.employeeId,
      assignedBy: actor.id,
      title: payload.title,
      description: payload.description,
      linkedKpiId: payload.linkedKpiId,
      priority: payload.priority,
      dueDate: payload.dueDate
    });

    await createNotification(connection, {
      userId: employee.userId,
      category: "task",
      title: "New performance task assigned",
      message: `A new task "${payload.title}" has been assigned to you${payload.dueDate ? ` and is due on ${payload.dueDate}` : ""}.`
    });

    await createActivityLog(connection, {
      userId: actor.id,
      action: `Assigned task "${payload.title}" to employee ${employee.employeeCode}.`
    });

    return createdTaskId;
  });

  return buildTaskDetail(taskId);
}

export async function updateTaskForManager(
  actor: AuthenticatedUser,
  taskId: number,
  input: {
    title?: string;
    description?: string;
    linkedKpiId?: number | null;
    priority?: TaskPriority;
    dueDate?: string | null;
    status?: TaskStatus;
  }
) {
  if (actor.role !== roles.admin && actor.role !== roles.hrManager) {
    throw new ApiError(403, "Only administrators and HR managers can update tasks.");
  }

  const existingTask = await ensureTaskAccess(taskId, actor);
  const payload = validateTaskUpdateInput(input);

  if (payload.linkedKpiId !== null) {
    const kpi = await findKpiById(payload.linkedKpiId);

    if (!kpi) {
      throw new ApiError(404, "Linked KPI was not found.");
    }
  }

  await withTransaction(async (connection) => {
    await updateTaskMetadata(connection, {
      taskId,
      title: payload.title,
      description: payload.description,
      linkedKpiId: payload.linkedKpiId,
      priority: payload.priority,
      dueDate: payload.dueDate,
      status: payload.status
    });

    await createActivityLog(connection, {
      userId: actor.id,
      action: `Updated task "${existingTask.title}" (${taskId}).`
    });
  });

  return buildTaskDetail(taskId);
}

export async function updateTaskProgressForEmployee(
  actor: AuthenticatedUser,
  taskId: number,
  input: {
    status?: TaskStatus;
  }
) {
  if (actor.role !== roles.employee) {
    throw new ApiError(403, "Only employees can update their personal task progress.");
  }

  const task = await ensureTaskAccess(taskId, actor);
  const status = input.status ?? "in_progress";

  if (status !== "not_started" && status !== "in_progress") {
    throw new ApiError(400, "Employees can only set a task to not started or in progress.");
  }

  await withTransaction(async (connection) => {
    await updateTaskStatus(connection, {
      taskId,
      status,
      submittedAt: task.submittedAt,
      reviewedBy: task.reviewedBy,
      reviewedAt: task.reviewedAt,
      reviewComment: task.reviewComment
    });

    await createActivityLog(connection, {
      userId: actor.id,
      action: `Updated task "${task.title}" progress to ${status}.`
    });
  });

  return buildTaskDetail(taskId);
}

export async function submitTaskWork(
  actor: AuthenticatedUser,
  taskId: number,
  input: {
    submissionNote?: string;
    attachment?: {
      fileName?: string;
      mimeType?: string;
      contentBase64?: string;
    } | null;
  }
) {
  if (actor.role !== roles.employee) {
    throw new ApiError(403, "Only employees can submit task work.");
  }

  const task = await ensureTaskAccess(taskId, actor);
  const submissionNote = normalizeText(input.submissionNote);

  if (!submissionNote) {
    throw new ApiError(400, "Submission notes are required.");
  }

  let attachmentPayload:
    | {
        originalName: string;
        storedName: string;
        mimeType: string;
        fileSize: number;
        fileUrl: string;
        buffer: Buffer;
      }
    | null = null;

  if (input.attachment?.contentBase64 && input.attachment.fileName && input.attachment.mimeType) {
    if (!allowedAttachmentMimeTypes.has(input.attachment.mimeType)) {
      throw new ApiError(400, "Attachment type is not supported.");
    }

    const buffer = Buffer.from(input.attachment.contentBase64, "base64");

    if (buffer.byteLength > 5 * 1024 * 1024) {
      throw new ApiError(400, "Attachment size must not exceed 5 MB.");
    }

    const safeFileName = input.attachment.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const storedName = `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;
    attachmentPayload = {
      originalName: input.attachment.fileName,
      storedName,
      mimeType: input.attachment.mimeType,
      fileSize: buffer.byteLength,
      fileUrl: `/uploads/tasks/${storedName}`,
      buffer
    };
  }

  const employeeId = await resolveEmployeeIdForActor(actor);

  await withTransaction(async (connection) => {
    const submissionId = await createTaskSubmission(connection, {
      taskId,
      employeeId,
      submissionNote
    });

    if (attachmentPayload) {
      await mkdir(taskUploadDirectory, { recursive: true });
      await writeFile(path.join(taskUploadDirectory, attachmentPayload.storedName), attachmentPayload.buffer);

      await createTaskSubmissionAttachment(connection, {
        submissionId,
        originalName: attachmentPayload.originalName,
        storedName: attachmentPayload.storedName,
        mimeType: attachmentPayload.mimeType,
        fileSize: attachmentPayload.fileSize,
        fileUrl: attachmentPayload.fileUrl
      });
    }

    await updateTaskStatus(connection, {
      taskId,
      status: "submitted",
      submittedAt: formatDateTimeForSql(),
      reviewedBy: null,
      reviewedAt: null,
      reviewComment: null
    });

    await createNotification(connection, {
      userId: task.assignedBy,
      category: "task",
      title: "Task work submitted",
      message: `${task.employeeName} submitted work for task "${task.title}".`
    });

    await createActivityLog(connection, {
      userId: actor.id,
      action: `Submitted work for task "${task.title}"${attachmentPayload ? " with attachment" : ""}.`
    });
  });

  return buildTaskDetail(taskId);
}

export async function reviewTaskSubmissionForManager(
  actor: AuthenticatedUser,
  taskId: number,
  submissionId: number,
  input: {
    status?: TaskSubmissionStatus;
    reviewComment?: string;
  }
) {
  if (actor.role !== roles.admin && actor.role !== roles.hrManager) {
    throw new ApiError(403, "Only administrators and HR managers can review task submissions.");
  }

  const task = await ensureTaskAccess(taskId, actor);
  const submission = await findTaskSubmissionById(submissionId);

  if (!submission || submission.taskId !== task.id) {
    throw new ApiError(404, "Task submission not found.");
  }

  const status = input.status;
  const reviewComment = normalizeText(input.reviewComment);

  if (status !== "approved" && status !== "needs_revision") {
    throw new ApiError(400, "Review status must be approved or needs_revision.");
  }

  await withTransaction(async (connection) => {
    await updateTaskSubmissionReview(connection, {
      submissionId,
      status,
      reviewComment,
      reviewedBy: actor.id
    });

    await updateTaskStatus(connection, {
      taskId: task.id,
      status: status === "approved" ? "completed" : "needs_revision",
      submittedAt: task.submittedAt ?? submission.createdAt,
      reviewedBy: actor.id,
      reviewedAt: formatDateTimeForSql(),
      reviewComment
    });

    await createNotification(connection, {
      userId: task.employeeUserId,
      category: "task",
      title: status === "approved" ? "Task approved" : "Task revision requested",
      message:
        status === "approved"
          ? `Your task "${task.title}" has been approved.`
          : `Your task "${task.title}" needs revision. Review the manager feedback in the system.`
    });

    await createActivityLog(connection, {
      userId: actor.id,
      action: `${status === "approved" ? "Approved" : "Requested revision for"} task "${task.title}".`
    });
  });

  return buildTaskDetail(taskId);
}
