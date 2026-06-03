import { useEffect, useState } from "react";

import { PageHeader } from "../../components/common/PageHeader";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";

type ReportsSummary = {
  generatedAt: string;
  departmentCount: number;
  evaluationCount: number;
  userCount: number;
  employeeCount: number;
  departmentBreakdown: Array<{
    departmentName: string;
    employeeCount: number;
  }>;
  note: string;
};

export function ReportsPage() {
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<"" | "pdf" | "excel">("");

  useEffect(() => {
    async function loadSummary() {
      try {
        const response = await api.get<ReportsSummary>("/reports");
        setSummary(response.data);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, "Unable to load report summary."));
      }
    }

    void loadSummary();
  }, []);

  async function downloadReport(type: "pdf" | "excel") {
    setError("");
    setDownloading(type);

    try {
      const response = await api.get<Blob>(`/reports/export/${type}`, {
        responseType: "blob"
      });
      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = type === "pdf" ? "performai-report.pdf" : "performai-report.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (downloadError) {
      setError(getApiErrorMessage(downloadError, "Unable to export report."));
    } finally {
      setDownloading("");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Reports and analytics"
        title="Reporting center"
        description="Generate evaluation summaries, department analytics, and export-ready performance insights."
      />

      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="panel p-6">
          <h2 className="text-xl font-semibold text-slate-950">Evaluation summaries</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Build downloadable reports for individual performance outcomes and recommendation history.
          </p>
          <button className="btn-primary mt-6" disabled={downloading === "pdf"} onClick={() => void downloadReport("pdf")}>
            {downloading === "pdf" ? "Generating..." : "Generate PDF"}
          </button>
        </article>

        <article className="panel p-6">
          <h2 className="text-xl font-semibold text-slate-950">Department analytics</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Compare departments using average scores, evaluation counts, and intervention frequency.
          </p>
          <button
            className="btn-secondary mt-6"
            disabled={downloading === "excel"}
            onClick={() => void downloadReport("excel")}
          >
            {downloading === "excel" ? "Exporting..." : "Export Excel"}
          </button>
        </article>

        <article className="panel p-6">
          <h2 className="text-xl font-semibold text-slate-950">Snapshot</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">{summary?.note ?? "Loading report summary..."}</p>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Departments</dt>
              <dd className="font-semibold text-slate-950">{summary?.departmentCount ?? 0}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Evaluations</dt>
              <dd className="font-semibold text-slate-950">{summary?.evaluationCount ?? 0}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Employees</dt>
              <dd className="font-semibold text-slate-950">{summary?.employeeCount ?? 0}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Users</dt>
              <dd className="font-semibold text-slate-950">{summary?.userCount ?? 0}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Generated</dt>
              <dd className="font-semibold text-slate-950">{summary?.generatedAt ?? "N/A"}</dd>
            </div>
          </dl>
        </article>
      </div>

      <section className="panel mt-6 p-6">
        <h2 className="text-xl font-semibold text-slate-950">Department breakdown</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-500">Department</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500">Employees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {summary?.departmentBreakdown.map((item) => (
                <tr key={item.departmentName}>
                  <td className="px-4 py-3 text-slate-700">{item.departmentName}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.employeeCount}</td>
                </tr>
              )) ?? null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
