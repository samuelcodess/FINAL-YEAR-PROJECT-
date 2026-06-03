import { useEffect, useState } from "react";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { MetricCard } from "../../components/common/MetricCard";
import { PageHeader } from "../../components/common/PageHeader";
import { api } from "../../lib/api";

type AdminDashboard = {
  metrics: {
    totalUsers: number;
    totalEmployees: number;
    totalDepartments: number;
    totalEvaluations: number;
  };
  learningPathwayAnalytics: {
    summary: {
      totalAssignments: number;
      completedAssignments: number;
      followUpRequiredAssignments: number;
      improvedAssignments: number;
      pendingMeasurement: number;
      averageImprovementDelta: number;
    };
    recentOutcomes: Array<{
      assignmentId: number;
      employeeId: number;
      employeeName: string;
      resourceId: string;
      assignedAt: string;
      dueDate: string | null;
      completionDecision: "in_progress" | "completed" | "follow_up_required";
      decisionComment: string | null;
      improvementDelta: number | null;
      baselineScore: number | null;
      followUpScore: number | null;
    }>;
  };
  departmentBreakdown: Array<{
    id: number;
    departmentName: string;
    employeeCount: number;
  }>;
};

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);

  useEffect(() => {
    void api.get<AdminDashboard>("/dashboard/admin").then((response) => setData(response.data));
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Admin dashboard"
        title="Organization-wide performance oversight"
        description="Monitor departments, user access, employee coverage, and overall evaluation activity from a single operational view."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total users" value={data?.metrics.totalUsers ?? 0} helper="Accounts in the platform" />
        <MetricCard label="Employees" value={data?.metrics.totalEmployees ?? 0} helper="Tracked employee records" />
        <MetricCard label="Departments" value={data?.metrics.totalDepartments ?? 0} helper="Business units in scope" />
        <MetricCard label="Evaluations" value={data?.metrics.totalEvaluations ?? 0} helper="Submitted review records" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Pathways assigned"
          value={data?.learningPathwayAnalytics.summary.totalAssignments ?? 0}
          helper="Tracked development pathways"
        />
        <MetricCard
          label="Pathways completed"
          value={data?.learningPathwayAnalytics.summary.completedAssignments ?? 0}
          helper="HR-approved completions"
        />
        <MetricCard
          label="Improved after pathway"
          value={data?.learningPathwayAnalytics.summary.improvedAssignments ?? 0}
          helper="Completed pathways followed by score gains"
        />
        <MetricCard
          label="Pending measurement"
          value={data?.learningPathwayAnalytics.summary.pendingMeasurement ?? 0}
          helper="Completed pathways awaiting another evaluation"
        />
      </div>

      <section className="panel mt-6 p-6">
        <h2 className="text-xl font-semibold text-slate-950">Department statistics</h2>
        <p className="mt-2 text-sm text-slate-500">Compare how many employees are currently represented in each department.</p>
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.departmentBreakdown ?? []}>
              <XAxis dataKey="departmentName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="employeeCount" fill="#1f8f6a" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel mt-6 p-6">
        <h2 className="text-xl font-semibold text-slate-950">Pathway performance impact</h2>
        <p className="mt-2 text-sm text-slate-500">
          Track whether finished learning pathways are actually followed by stronger later evaluation scores.
        </p>
        <div className="mt-6 space-y-4">
          {data?.learningPathwayAnalytics.recentOutcomes.map((item) => (
            <article className="rounded-2xl border border-slate-200 p-4" key={item.assignmentId}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-950">{item.employeeName}</h3>
                  <p className="text-sm text-slate-500">{item.resourceId}</p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                  {item.completionDecision.split("_").join(" ")}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                Assigned: {item.assignedAt} | Deadline: {item.dueDate ?? "Not set"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Baseline: {item.baselineScore ?? "N/A"} | Follow-up: {item.followUpScore ?? "N/A"} | Change:{" "}
                {item.improvementDelta !== null ? `${item.improvementDelta > 0 ? "+" : ""}${item.improvementDelta}` : "Awaiting later evaluation"}
              </p>
              {item.decisionComment ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.decisionComment}</p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
