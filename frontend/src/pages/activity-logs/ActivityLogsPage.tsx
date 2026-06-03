import { useEffect, useState } from "react";

import { PageHeader } from "../../components/common/PageHeader";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";

type ActivityLog = {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  role: string;
  action: string;
  timestamp: string;
};

export function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const pageSize = 12;

  async function loadLogs() {
    try {
      setError("");
      const response = await api.get<{
        items: ActivityLog[];
        total: number;
      }>("/activity-logs", {
        params: {
          q: q || undefined,
          page,
          pageSize
        }
      });
      setLogs(response.data.items);
      setTotal(response.data.total);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Unable to load activity logs."));
    }
  }

  useEffect(() => {
    void loadLogs();
  }, [page, q]);

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div>
      <PageHeader
        eyebrow="Audit trail"
        title="Activity logs"
        description="Review critical user actions across authentication, employee management, evaluations, and administrative changes."
      />

      <section className="panel mb-6 flex flex-col gap-4 p-6 md:flex-row">
        <input
          className="input"
          placeholder="Search actor name or action"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
        />
        <button
          className="btn-secondary md:min-w-32"
          onClick={() => {
            setQ("");
            setPage(1);
          }}
          type="button"
        >
          Reset
        </button>
      </section>

      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Actor", "Role", "Action", "Timestamp"].map((header) => (
                  <th key={header} className="px-4 py-3 text-left font-semibold text-slate-500">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-950">{log.fullName}</div>
                    <div className="text-slate-500">{log.email}</div>
                  </td>
                  <td className="px-4 py-4 capitalize text-slate-600">{log.role.replace("_", " ")}</td>
                  <td className="px-4 py-4 text-slate-700">{log.action}</td>
                  <td className="px-4 py-4 text-slate-500">{log.timestamp}</td>
                </tr>
              ))}
              {logs.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                    No activity logs matched the current search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          Showing {logs.length} of {total} logs
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
