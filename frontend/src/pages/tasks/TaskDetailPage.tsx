import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import { PageHeader } from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { api, getFileUrl } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";

type TaskPriority = "low" | "medium" | "high";
type TaskStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "completed"
  | "needs_revision"
  | "cancelled";
type TaskSubmissionStatus = "submitted" | "approved" | "needs_revision";

type TaskDetail = {
  id: number;
  employeeId: number;
  employeeUserId: number;
  employeeName: string;
  employeeCode: string;
  departmentName: string | null;
  assignedBy: number;
  assignedByName: string;
  title: string;
  description: string;
  linkedKpiId: number | null;
  linkedKpiName: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  submittedAt: string | null;
  reviewedBy: number | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;
  createdAt: string;
  updatedAt: string;
  submissions: Array<{
    id: number;
    taskId: number;
    employeeId: number;
    employeeName: string;
    submissionNote: string;
    aiScore: number;
    aiFeedback: string;
    aiStrengths: string;
    aiImprovements: string;
    aiRecommendation: "ready_for_review" | "needs_revision";
    status: TaskSubmissionStatus;
    reviewComment: string | null;
    reviewedBy: number | null;
    reviewedByName: string | null;
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
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
  }>;
};

type KpiOption = {
  id: number;
  kpiName: string;
};

function getStatusTone(status: TaskStatus | TaskSubmissionStatus) {
  switch (status) {
    case "completed":
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "submitted":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "needs_revision":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "in_progress":
      return "border-brand-100 bg-brand-50 text-brand-700";
    case "cancelled":
      return "border-slate-300 bg-slate-200 text-slate-600";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function formatStatus(status: string) {
  return status.split("_").join(" ");
}

export function TaskDetailPage() {
  const { taskId = "" } = useParams();
  const { session } = useAuth();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [kpis, setKpis] = useState<KpiOption[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingTask, setSavingTask] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [submittingWork, setSubmittingWork] = useState(false);
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<number | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    linkedKpiId: "",
    priority: "medium" as TaskPriority,
    dueDate: "",
    status: "not_started" as TaskStatus
  });
  const [submissionNote, setSubmissionNote] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [reviewComments, setReviewComments] = useState<Record<number, string>>({});

  const canManageTask = session?.user.role === "admin" || session?.user.role === "hr_manager";
  const canSubmitTaskWork = session?.user.role === "employee";

  async function loadTask() {
    try {
      setError("");
      const response = await api.get<TaskDetail>(`/tasks/${taskId}`);
      setTask(response.data);
      setTaskForm({
        title: response.data.title,
        description: response.data.description,
        linkedKpiId: response.data.linkedKpiId ? String(response.data.linkedKpiId) : "",
        priority: response.data.priority,
        dueDate: response.data.dueDate ?? "",
        status: response.data.status
      });
      setReviewComments((current) => {
        const next = { ...current };

        for (const submission of response.data.submissions) {
          next[submission.id] = current[submission.id] ?? "";
        }

        return next;
      });
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Unable to load task details."));
    }
  }

  useEffect(() => {
    void loadTask();
  }, [taskId]);

  useEffect(() => {
    if (!canManageTask) {
      return;
    }

    void api.get<KpiOption[]>("/kpis").then((response) => setKpis(response.data));
  }, [canManageTask]);

  async function handleTaskUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingTask(true);
    setError("");
    setSuccess("");

    try {
      await api.put(`/tasks/${taskId}`, {
        title: taskForm.title,
        description: taskForm.description,
        linkedKpiId: taskForm.linkedKpiId ? Number(taskForm.linkedKpiId) : null,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate || null,
        status: taskForm.status
      });
      setSuccess("Task details updated successfully.");
      await loadTask();
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to update the task."));
    } finally {
      setSavingTask(false);
    }
  }

  async function handleProgressUpdate(status: TaskStatus) {
    setSavingProgress(true);
    setError("");
    setSuccess("");

    try {
      await api.put(`/tasks/${taskId}/progress`, { status });
      setSuccess(`Task status updated to ${formatStatus(status)}.`);
      await loadTask();
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to update task progress."));
    } finally {
      setSavingProgress(false);
    }
  }

  async function handleSubmitWork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittingWork(true);
    setError("");
    setSuccess("");

    try {
      let attachment:
        | {
            fileName: string;
            mimeType: string;
            contentBase64: string;
          }
        | undefined;

      if (submissionFile) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const value = String(reader.result ?? "");
            const [, contentBase64 = ""] = value.split(",");
            resolve(contentBase64);
          };
          reader.onerror = () => reject(new Error("Unable to read the selected file."));
          reader.readAsDataURL(submissionFile);
        });

        attachment = {
          fileName: submissionFile.name,
          mimeType: submissionFile.type || "application/octet-stream",
          contentBase64: base64
        };
      }

      await api.post(`/tasks/${taskId}/submissions`, {
        submissionNote,
        attachment
      });

      setSubmissionNote("");
      setSubmissionFile(null);
      setSuccess("Task work submitted successfully.");
      await loadTask();
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to submit task work."));
    } finally {
      setSubmittingWork(false);
    }
  }

  async function handleReview(submissionId: number, status: TaskSubmissionStatus) {
    setReviewingSubmissionId(submissionId);
    setError("");
    setSuccess("");

    try {
      await api.put(`/tasks/${taskId}/submissions/${submissionId}/review`, {
        status,
        reviewComment: reviewComments[submissionId] ?? ""
      });
      setSuccess(status === "approved" ? "Submission approved." : "Revision request sent.");
      await loadTask();
    } catch (reviewError) {
      setError(getApiErrorMessage(reviewError, "Unable to review task submission."));
    } finally {
      setReviewingSubmissionId(null);
    }
  }

  if (!task) {
    return (
      <div>
        <PageHeader
          eyebrow="Task management"
          title="Task not found"
          description="The task may have been removed or is no longer available to this role."
        />
        {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}
        <Link className="btn-primary" to="/tasks">
          Back to tasks
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Task management"
        title={task.title}
        description="Keep work execution, submission evidence, and manager review inside the system for transparency."
      />

      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="mb-4 text-sm text-brand-700">{success}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <article className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Task summary</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{task.description}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusTone(task.status)}`}>
                {formatStatus(task.status)}
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Assigned to</p>
                <p className="mt-2 font-semibold text-slate-950">{task.employeeName}</p>
                <p className="text-sm text-slate-500">
                  {task.employeeCode} {task.departmentName ? `- ${task.departmentName}` : ""}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Assignment owner</p>
                <p className="mt-2 font-semibold text-slate-950">{task.assignedByName}</p>
                <p className="text-sm text-slate-500">Created {task.createdAt}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Priority</p>
                <p className="mt-2 font-semibold capitalize text-slate-950">{task.priority}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Due date</p>
                <p className="mt-2 font-semibold text-slate-950">{task.dueDate ?? "Not set"}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Linked KPI</p>
              <p className="mt-2 text-sm font-medium text-slate-950">{task.linkedKpiName ?? "No KPI linked to this task."}</p>
            </div>

            {task.reviewComment ? (
              <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Latest manager feedback</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{task.reviewComment}</p>
                {task.reviewedByName ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Reviewed by {task.reviewedByName} on {task.reviewedAt ?? "N/A"}
                  </p>
                ) : null}
              </div>
            ) : null}
          </article>

          {canSubmitTaskWork ? (
            <article className="panel p-6">
              <h2 className="text-xl font-semibold text-slate-950">Employee action area</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Update your progress, then submit the completed work or evidence directly in the system.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className="btn-secondary"
                  disabled={savingProgress || task.status === "not_started"}
                  onClick={() => void handleProgressUpdate("not_started")}
                  type="button"
                >
                  Mark not started
                </button>
                <button
                  className="btn-primary"
                  disabled={savingProgress || task.status === "in_progress"}
                  onClick={() => void handleProgressUpdate("in_progress")}
                  type="button"
                >
                  {savingProgress ? "Saving..." : "Mark in progress"}
                </button>
              </div>

              <form className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4" onSubmit={handleSubmitWork}>
                <p className="text-sm font-semibold text-slate-950">Submit task work</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Explain what you completed, attach the actual work or evidence, and submit it for manager review.
                </p>
                <textarea
                  className="input mt-4 min-h-32"
                  placeholder="Describe the work done, what result was achieved, and any context the reviewer should know."
                  value={submissionNote}
                  onChange={(event) => setSubmissionNote(event.target.value)}
                />
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Upload evidence file</span>
                  <input
                    className="input"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                    onChange={(event) => setSubmissionFile(event.target.files?.[0] ?? null)}
                  />
                </label>
                {submissionFile ? <p className="mt-2 text-xs text-slate-500">Selected: {submissionFile.name}</p> : null}
                <button className="btn-primary mt-4" disabled={submittingWork} type="submit">
                  {submittingWork ? "Submitting..." : "Submit work for review"}
                </button>
              </form>
            </article>
          ) : null}

          <article className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Submission trail</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Every work submission, review note, and file stays visible here for transparency.
            </p>

            <div className="mt-5 space-y-4">
              {task.submissions.map((submission) => (
                <div className="rounded-2xl border border-slate-200 bg-white p-4" key={submission.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusTone(submission.status)}`}>
                        {formatStatus(submission.status)}
                      </span>
                      <p className="text-xs text-slate-500">Submitted {submission.createdAt}</p>
                    </div>
                    {submission.reviewedAt ? (
                      <p className="text-xs text-slate-500">
                        Reviewed {submission.reviewedAt}
                        {submission.reviewedByName ? ` by ${submission.reviewedByName}` : ""}
                      </p>
                    ) : null}
                  </div>

                  <p className="mt-4 text-sm leading-7 text-slate-700">{submission.submissionNote}</p>

                  <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">AI pre-review</p>
                      <span className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                        {submission.aiRecommendation.split("_").join(" ")}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-950">Score: {submission.aiScore}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{submission.aiFeedback}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      <span className="font-medium text-slate-950">Strengths:</span> {submission.aiStrengths}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      <span className="font-medium text-slate-950">Improvements:</span> {submission.aiImprovements}
                    </p>
                  </div>

                  {submission.attachments.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Attachments</p>
                      <div className="mt-3 space-y-2">
                        {submission.attachments.map((attachment) => (
                          <a
                            className="inline-flex text-sm font-medium text-brand-700"
                            href={getFileUrl(attachment.fileUrl)}
                            key={attachment.id}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {attachment.originalName} ({Math.ceil(attachment.fileSize / 1024)} KB)
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {submission.reviewComment ? (
                    <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Review comment</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{submission.reviewComment}</p>
                    </div>
                  ) : null}

                  {canManageTask ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-sm font-semibold text-slate-950">Manager review</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Approve completed work or return it with revision guidance.
                      </p>
                      <textarea
                        className="input mt-4 min-h-24"
                        placeholder="Add a review note or revision instruction"
                        value={reviewComments[submission.id] ?? ""}
                        onChange={(event) =>
                          setReviewComments((current) => ({
                            ...current,
                            [submission.id]: event.target.value
                          }))
                        }
                      />
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          className="btn-primary"
                          disabled={reviewingSubmissionId === submission.id}
                          onClick={() => void handleReview(submission.id, "approved")}
                          type="button"
                        >
                          {reviewingSubmissionId === submission.id ? "Saving..." : "Approve task work"}
                        </button>
                        <button
                          className="btn-secondary"
                          disabled={reviewingSubmissionId === submission.id}
                          onClick={() => void handleReview(submission.id, "needs_revision")}
                          type="button"
                        >
                          Request revision
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}

              {task.submissions.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                  No task work has been submitted yet.
                </div>
              ) : null}
            </div>
          </article>
        </section>

        <section className="space-y-6">
          {canManageTask ? (
            <article className="panel p-6">
              <h2 className="text-xl font-semibold text-slate-950">Manager controls</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Adjust deadlines, priority, and task wording without losing the submission history.
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleTaskUpdate}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Task title</span>
                  <input
                    className="input"
                    value={taskForm.title}
                    onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Task description</span>
                  <textarea
                    className="input min-h-28"
                    value={taskForm.description}
                    onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Linked KPI</span>
                  <select
                    className="input"
                    value={taskForm.linkedKpiId}
                    onChange={(event) => setTaskForm((current) => ({ ...current, linkedKpiId: event.target.value }))}
                  >
                    <option value="">No KPI link</option>
                    {kpis.map((kpi) => (
                      <option key={kpi.id} value={kpi.id}>
                        {kpi.kpiName}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Priority</span>
                    <select
                      className="input"
                      value={taskForm.priority}
                      onChange={(event) =>
                        setTaskForm((current) => ({
                          ...current,
                          priority: event.target.value as TaskPriority
                        }))
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Due date</span>
                    <input
                      className="input"
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Task status</span>
                  <select
                    className="input"
                    value={taskForm.status}
                    onChange={(event) =>
                      setTaskForm((current) => ({
                        ...current,
                        status: event.target.value as TaskStatus
                      }))
                    }
                  >
                    <option value="not_started">Not started</option>
                    <option value="in_progress">In progress</option>
                    <option value="submitted">Submitted</option>
                    <option value="completed">Completed</option>
                    <option value="needs_revision">Needs revision</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>

                <button className="btn-primary" disabled={savingTask} type="submit">
                  {savingTask ? "Saving..." : "Save task changes"}
                </button>
              </form>
            </article>
          ) : null}

          <article className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Transparency notes</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>All assignment instructions, evidence uploads, status changes, and review notes stay inside this task record.</p>
              <p>The employee cannot hide completion outside the platform because the work trail is stored in one place.</p>
              <p>HR and Admin can monitor whether the assigned action was completed, revised, delayed, or approved.</p>
            </div>
          </article>

          <article className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Quick links</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link className="btn-primary" to="/tasks">
                Back to tasks
              </Link>
              <Link className="btn-secondary" to="/recommendations">
                Recommendations
              </Link>
              <Link className="btn-secondary" to="/dashboard">
                Dashboard
              </Link>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
