import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useUnreadSummary } from "../../context/UnreadSummaryContext";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";

type TaskPriority = "low" | "medium" | "high";
type TaskStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "completed"
  | "needs_revision"
  | "cancelled";
type TaskView = "active" | "history";

type TaskRow = {
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
  reviewedAt: string | null;
  reviewComment: string | null;
  createdAt: string;
  updatedAt: string;
};

type EmployeeOption = {
  id: number;
  fullName: string;
  employeeCode: string;
  departmentName: string;
};

type KpiOption = {
  id: number;
  kpiName: string;
};

function formatStatus(status: TaskStatus) {
  return status.split("_").join(" ");
}

function getStatusTone(status: TaskStatus) {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700";
    case "submitted":
      return "bg-sky-50 text-sky-700";
    case "needs_revision":
      return "bg-amber-50 text-amber-700";
    case "in_progress":
      return "bg-brand-50 text-brand-700";
    case "cancelled":
      return "bg-slate-200 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getPriorityTone(priority: TaskPriority) {
  switch (priority) {
    case "high":
      return "bg-rose-50 text-rose-700";
    case "medium":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function TasksPage() {
  const { session } = useAuth();
  const { refreshSummary } = useUnreadSummary();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [kpis, setKpis] = useState<KpiOption[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [view, setView] = useState<TaskView>("active");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    title: "",
    description: "",
    linkedKpiId: "",
    priority: "medium" as TaskPriority,
    dueDate: ""
  });
  const pageSize = 8;
  const canAssignTasks = session?.user.role === "admin" || session?.user.role === "hr_manager";

  async function loadTasks() {
    try {
      setError("");
      const response = await api.get<{ items: TaskRow[]; total: number }>("/tasks", {
        params: {
          q: q || undefined,
          status: status || undefined,
          scope: view,
          page,
          pageSize
        }
      });
      setTasks(response.data.items);
      setTotal(response.data.total);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Unable to load tasks."));
    }
  }

  useEffect(() => {
    void loadTasks();
  }, [page, q, status, view]);

  useEffect(() => {
    async function markTaskAlertsRead() {
      try {
        await api.patch("/notifications/read-category/task");
        await refreshSummary();
      } catch {
        // Keep the task page usable even if the badge refresh fails.
      }
    }

    void markTaskAlertsRead();
  }, [refreshSummary]);

  useEffect(() => {
    if (!canAssignTasks) {
      return;
    }

    async function loadAssignmentData() {
      try {
        const [employeesResponse, kpisResponse] = await Promise.all([
          api.get<{ items: EmployeeOption[] }>("/employees", {
            params: {
              page: 1,
              pageSize: 100
            }
          }),
          api.get<KpiOption[]>("/kpis")
        ]);

        setEmployees(employeesResponse.data.items);
        setKpis(kpisResponse.data);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, "Unable to load task assignment options."));
      }
    }

    void loadAssignmentData();
  }, [canAssignTasks]);

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/tasks", {
        employeeId: Number(form.employeeId),
        title: form.title,
        description: form.description,
        linkedKpiId: form.linkedKpiId ? Number(form.linkedKpiId) : null,
        priority: form.priority,
        dueDate: form.dueDate || null
      });

      setForm({
        employeeId: "",
        title: "",
        description: "",
        linkedKpiId: "",
        priority: "medium",
        dueDate: ""
      });
      setSuccess("Task assigned successfully.");
      await loadTasks();
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to assign task."));
    } finally {
      setSaving(false);
    }
  }

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div>
      <PageHeader
        eyebrow="Task management"
        title={canAssignTasks ? "Transparent performance task workflow" : "My assigned tasks"}
        description={
          canAssignTasks
            ? "Assign real work inside the system, monitor submissions, and keep a transparent performance action trail."
            : "Review the work assigned to you, update progress, and submit deliverables directly inside the platform."
        }
      />

      {canAssignTasks ? (
        <section className="panel mb-6 p-6">
          <h2 className="text-xl font-semibold text-slate-950">Assign a new task</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Use this to turn evaluation outcomes or coaching actions into visible operational work for the employee.
          </p>

          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleCreateTask}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Employee</span>
              <select
                className="input"
                value={form.employeeId}
                onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))}
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName} - {employee.employeeCode}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Linked KPI</span>
              <select
                className="input"
                value={form.linkedKpiId}
                onChange={(event) => setForm((current) => ({ ...current, linkedKpiId: event.target.value }))}
              >
                <option value="">Optional KPI linkage</option>
                {kpis.map((kpi) => (
                  <option key={kpi.id} value={kpi.id}>
                    {kpi.kpiName}
                  </option>
                ))}
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Task title</span>
              <input
                className="input"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Task description</span>
              <textarea
                className="input min-h-28"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Priority</span>
              <select
                className="input"
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({
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
                value={form.dueDate}
                onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
              />
            </label>

            <div className="md:col-span-2">
              <button className="btn-primary" disabled={saving} type="submit">
                {saving ? "Assigning..." : "Assign task"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="panel mb-6 flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex gap-2 rounded-full bg-slate-100 p-1">
          <button
            className={view === "active" ? "btn-primary" : "rounded-full px-4 py-2 text-sm font-medium text-slate-600"}
            onClick={() => {
              setView("active");
              setStatus("");
              setPage(1);
            }}
            type="button"
          >
            Active tasks
          </button>
          <button
            className={view === "history" ? "btn-primary" : "rounded-full px-4 py-2 text-sm font-medium text-slate-600"}
            onClick={() => {
              setView("history");
              setStatus("");
              setPage(1);
            }}
            type="button"
          >
            Task history
          </button>
        </div>
        <p className="text-sm text-slate-500">
          {view === "active"
            ? "Only open tasks stay here so the work queue remains clean."
            : "Completed and cancelled tasks move here for later review."}
        </p>
      </section>

      <section className="panel mb-6 grid gap-4 p-6 md:grid-cols-[1.4fr_0.8fr_auto]">
        <input
          className="input"
          placeholder={canAssignTasks ? "Search by title, employee, or code" : "Search by task title"}
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
        />
        <select
          className="input"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as TaskStatus | "");
            setPage(1);
          }}
        >
          <option value="">{view === "active" ? "All active statuses" : "All history statuses"}</option>
          {view === "active" ? (
            <>
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="submitted">Submitted</option>
              <option value="needs_revision">Needs revision</option>
            </>
          ) : (
            <>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </>
          )}
        </select>
        <button
          className="btn-secondary"
          onClick={() => {
            setQ("");
            setStatus("");
            setPage(1);
          }}
          type="button"
        >
          Reset
        </button>
      </section>

      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="mb-4 text-sm text-brand-700">{success}</p> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {tasks.map((task) => (
          <article className="panel p-6" key={task.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{task.title}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {canAssignTasks ? `${task.employeeName} - ${task.employeeCode}` : `Assigned by ${task.assignedByName}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getPriorityTone(task.priority)}`}>
                  {task.priority}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusTone(task.status)}`}>
                  {formatStatus(task.status)}
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">{task.description}</p>

            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Due date</p>
                <p className="mt-2 font-medium text-slate-950">{task.dueDate ?? "Not set"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Linked KPI</p>
                <p className="mt-2 font-medium text-slate-950">{task.linkedKpiName ?? "Not linked"}</p>
              </div>
            </div>

            {task.reviewComment ? (
              <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Latest review note</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{task.reviewComment}</p>
              </div>
            ) : null}

            <div className="mt-5 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Created {task.createdAt}
                {task.submittedAt ? ` | Last submitted ${task.submittedAt}` : ""}
              </div>
              <Link className="btn-primary" to={`/tasks/${task.id}`}>
                Open task
              </Link>
            </div>
          </article>
        ))}
      </div>

      {tasks.length === 0 ? (
        <section className="panel mt-6 p-6 text-sm text-slate-500">
          {view === "active"
            ? "No active tasks matched the current filters."
            : "No completed or cancelled tasks matched the current filters."}
        </section>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          Showing {tasks.length} of {total} tasks
        </p>
        <div className="flex gap-3">
          <button
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            type="button"
          >
            Previous
          </button>
          <span className="flex items-center text-sm font-medium text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
