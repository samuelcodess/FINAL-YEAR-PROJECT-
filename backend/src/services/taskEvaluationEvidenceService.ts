import { listTaskSubmissionAttachments } from "../repositories/taskSubmissionAttachmentRepository";
import {
  listTaskSubmissionsForTaskIds,
  type TaskSubmissionRow
} from "../repositories/taskSubmissionRepository";
import { listTasksForEmployeeEvaluation, type TaskRow } from "../repositories/taskRepository";

type TaskSubmissionWithAttachments = TaskSubmissionRow & {
  attachments: Array<{
    id: number;
    submissionId: number;
    originalName: string;
    storedName: string;
    mimeType: string;
    fileSize: number;
    fileUrl: string;
    uploadedAt: string;
  }>;
};

export type TaskEvidenceMetrics = {
  totalTasks: number;
  completedTasks: number;
  approvedTasks: number;
  submittedTasks: number;
  overdueTasks: number;
  onTimeTasks: number;
  reviewedTasks: number;
  revisionRequests: number;
  attachmentCount: number;
  averageSubmissionWords: number;
  completionRate: number;
  approvalRate: number;
  onTimeRate: number | null;
  revisionRate: number;
};

export type TaskEvidenceKpiSummary = {
  kpiId: number | null;
  kpiName: string | null;
  metrics: TaskEvidenceMetrics;
  evidenceText: string;
};

export type TaskEvaluationEvidence = {
  periodStartDate: string;
  periodEndDate: string;
  metrics: TaskEvidenceMetrics;
  summary: string;
  taskHighlights: string[];
  kpiSummaries: TaskEvidenceKpiSummary[];
};

function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function round(value: number) {
  return Number(value.toFixed(2));
}

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveCompletionTimestamp(task: TaskRow, submissions: TaskSubmissionWithAttachments[]) {
  const approvedSubmission = submissions.find((submission) => submission.status === "approved");
  return (
    parseDate(task.reviewedAt) ??
    parseDate(approvedSubmission?.reviewedAt ?? null) ??
    parseDate(task.submittedAt) ??
    parseDate(submissions[0]?.createdAt ?? null)
  );
}

function isOnTime(task: TaskRow, submissions: TaskSubmissionWithAttachments[]) {
  const dueDate = parseDate(task.dueDate ? `${task.dueDate}T23:59:59` : null);

  if (!dueDate) {
    return null;
  }

  const completionTimestamp = resolveCompletionTimestamp(task, submissions);

  if (!completionTimestamp) {
    return null;
  }

  return completionTimestamp.getTime() <= dueDate.getTime();
}

function buildMetrics(tasks: Array<{ task: TaskRow; submissions: TaskSubmissionWithAttachments[] }>): TaskEvidenceMetrics {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((item) => item.task.status === "completed").length;
  const approvedTasks = tasks.filter((item) =>
    item.submissions.some((submission) => submission.status === "approved") || item.task.status === "completed"
  ).length;
  const submittedTasks = tasks.filter((item) => item.submissions.length > 0 || item.task.status === "submitted").length;
  const reviewedTasks = tasks.filter((item) => item.task.reviewedAt || item.submissions.some((submission) => submission.reviewedAt)).length;
  const revisionRequests = tasks.filter((item) =>
    item.task.status === "needs_revision" || item.submissions.some((submission) => submission.status === "needs_revision")
  ).length;
  const attachmentCount = tasks.reduce(
    (sum, item) => sum + item.submissions.reduce((submissionSum, submission) => submissionSum + submission.attachments.length, 0),
    0
  );
  const totalSubmissionWords = tasks.reduce(
    (sum, item) => sum + item.submissions.reduce((submissionSum, submission) => submissionSum + countWords(submission.submissionNote), 0),
    0
  );
  const totalSubmissions = tasks.reduce((sum, item) => sum + item.submissions.length, 0);
  const dueTasks = tasks.filter((item) => item.task.dueDate !== null);
  const onTimeTasks = tasks.filter((item) => isOnTime(item.task, item.submissions) === true).length;
  const overdueTasks = tasks.filter((item) => isOnTime(item.task, item.submissions) === false).length;

  return {
    totalTasks,
    completedTasks,
    approvedTasks,
    submittedTasks,
    overdueTasks,
    onTimeTasks,
    reviewedTasks,
    revisionRequests,
    attachmentCount,
    averageSubmissionWords: totalSubmissions > 0 ? round(totalSubmissionWords / totalSubmissions) : 0,
    completionRate: totalTasks > 0 ? round((completedTasks / totalTasks) * 100) : 0,
    approvalRate: totalTasks > 0 ? round((approvedTasks / totalTasks) * 100) : 0,
    onTimeRate: dueTasks.length > 0 ? round((onTimeTasks / dueTasks.length) * 100) : null,
    revisionRate: reviewedTasks > 0 ? round((revisionRequests / reviewedTasks) * 100) : 0
  };
}

function buildTaskLine(task: TaskRow, submissions: TaskSubmissionWithAttachments[]) {
  const latestSubmission = submissions[0] ?? null;
  const onTime = isOnTime(task, submissions);
  const timingLabel = onTime === null ? "timing unavailable" : onTime ? "on time" : "late";
  const latestNote = latestSubmission?.submissionNote
    ? latestSubmission.submissionNote.slice(0, 220)
    : "No submission note was provided.";
  const reviewNote = task.reviewComment || latestSubmission?.reviewComment || "No manager review comment yet.";

  return [
    `Task: ${task.title}`,
    `linked KPI: ${task.linkedKpiName ?? "unlinked"}`,
    `status: ${task.status}`,
    `due date: ${task.dueDate ?? "not set"}`,
    `submission timing: ${timingLabel}`,
    `latest submission note: ${latestNote}`,
    `manager review: ${reviewNote}`
  ].join("; ");
}

function buildSummary(periodStartDate: string, periodEndDate: string, metrics: TaskEvidenceMetrics) {
  const timingText =
    metrics.onTimeRate === null
      ? "No due-date based timeliness signal was available."
      : `${metrics.onTimeTasks} of ${metrics.onTimeTasks + metrics.overdueTasks} due tasks were on time (${metrics.onTimeRate}%).`;

  return [
    `Evaluation evidence period: ${periodStartDate} to ${periodEndDate}.`,
    `${metrics.totalTasks} tasks were considered.`,
    `${metrics.completedTasks} tasks were completed and ${metrics.approvedTasks} received approved outcomes.`,
    timingText,
    `${metrics.revisionRequests} revision requests were recorded.`,
    `Average submission richness was ${metrics.averageSubmissionWords} words per submission with ${metrics.attachmentCount} supporting attachments in total.`
  ].join(" ");
}

export async function buildTaskEvaluationEvidence(input: {
  employeeId: number;
  periodStartDate: string;
  periodEndDate: string;
}) {
  const tasks = await listTasksForEmployeeEvaluation(input);
  const submissions = await listTaskSubmissionsForTaskIds(tasks.map((task) => task.id));
  const attachments = await listTaskSubmissionAttachments(submissions.map((submission) => submission.id));
  const attachmentMap = new Map<number, typeof attachments>();

  for (const attachment of attachments) {
    const current = attachmentMap.get(attachment.submissionId) ?? [];
    current.push(attachment);
    attachmentMap.set(attachment.submissionId, current);
  }

  const groupedSubmissions = new Map<number, TaskSubmissionWithAttachments[]>();

  for (const submission of submissions) {
    const current = groupedSubmissions.get(submission.taskId) ?? [];
    current.push({
      ...submission,
      attachments: attachmentMap.get(submission.id) ?? []
    });
    groupedSubmissions.set(submission.taskId, current);
  }

  for (const group of groupedSubmissions.values()) {
    group.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  const taskSnapshots = tasks.map((task) => ({
    task,
    submissions: groupedSubmissions.get(task.id) ?? []
  }));
  const metrics = buildMetrics(taskSnapshots);
  const summary = buildSummary(input.periodStartDate, input.periodEndDate, metrics);
  const taskHighlights = taskSnapshots.slice(0, 6).map((item) => buildTaskLine(item.task, item.submissions));
  const groupedByKpi = new Map<string, typeof taskSnapshots>();

  for (const snapshot of taskSnapshots) {
    const key = snapshot.task.linkedKpiId ? String(snapshot.task.linkedKpiId) : "unlinked";
    const current = groupedByKpi.get(key) ?? [];
    current.push(snapshot);
    groupedByKpi.set(key, current);
  }

  const kpiSummaries = [...groupedByKpi.values()].map((items) => ({
    kpiId: items[0]?.task.linkedKpiId ?? null,
    kpiName: items[0]?.task.linkedKpiName ?? null,
    metrics: buildMetrics(items),
    evidenceText: items.slice(0, 4).map((item) => buildTaskLine(item.task, item.submissions)).join("\n")
  }));

  return {
    periodStartDate: input.periodStartDate,
    periodEndDate: input.periodEndDate,
    metrics,
    summary,
    taskHighlights,
    kpiSummaries
  } satisfies TaskEvaluationEvidence;
}
