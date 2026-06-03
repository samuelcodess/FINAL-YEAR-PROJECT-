import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import { MetricCard } from "../../components/common/MetricCard";
import { PageHeader } from "../../components/common/PageHeader";
import { api } from "../../lib/api";

type HrDashboard = {
  metrics: {
    pendingEvaluations: number;
    employeesTracked: number;
    openRecommendations: number;
    unreadNotifications: number;
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
  latestEvaluations: Array<{
    id: number;
    evaluationDate: string;
    totalScore: number;
    performanceLevel: string;
    trend: string;
  }>;
};

const pieColors = ["#1f8f6a", "#0f172a", "#38bdf8", "#f59e0b"];

export function HrDashboardPage() {
  const [data, setData] = useState<HrDashboard | null>(null);

  useEffect(() => {
    void api.get<HrDashboard>("/dashboard/hr").then((response) => setData(response.data));
  }, []);

  const chartData = data
    ? [
        { name: "Pending", value: data.metrics.pendingEvaluations },
        { name: "Tracked", value: data.metrics.employeesTracked },
        { name: "Recommendations", value: data.metrics.openRecommendations },
        { name: "Unread", value: data.metrics.unreadNotifications }
      ]
    : [];

  return (
    <div>
      <PageHeader
        eyebrow="HR dashboard"
        title="Performance operations at a glance"
        description="Track pending reviews, intervention workload, and the latest evaluation outcomes across the employee base."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pending evaluations" value={data?.metrics.pendingEvaluations ?? 0} helper="Reviews awaiting action" />
        <MetricCard label="Employees tracked" value={data?.metrics.employeesTracked ?? 0} helper="Profiles currently managed" />
        <MetricCard label="Recommendations" value={data?.metrics.openRecommendations ?? 0} helper="Generated intervention actions" />
        <MetricCard label="Unread alerts" value={data?.metrics.unreadNotifications ?? 0} helper="New items for HR attention" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Pathways completed"
          value={data?.learningPathwayAnalytics.summary.completedAssignments ?? 0}
          helper="Final HR decisions marked complete"
        />
        <MetricCard
          label="Follow-up required"
          value={data?.learningPathwayAnalytics.summary.followUpRequiredAssignments ?? 0}
          helper="Pathways still needing another intervention"
        />
        <MetricCard
          label="Measured improvement"
          value={data?.learningPathwayAnalytics.summary.improvedAssignments ?? 0}
          helper="Completed pathways with later score gains"
        />
        <MetricCard
          label="Average score change"
          value={data?.learningPathwayAnalytics.summary.averageImprovementDelta ?? 0}
          helper="Change between baseline and follow-up evaluations"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="panel p-6">
          <h2 className="text-xl font-semibold text-slate-950">Operational snapshot</h2>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                  {chartData.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-xl font-semibold text-slate-950">Latest evaluations</h2>
          <div className="mt-6 space-y-4">
            {data?.latestEvaluations.map((item) => (
              <article className="rounded-2xl border border-slate-200 p-4" key={item.id}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-950">{item.performanceLevel.replace("_", " ")}</h3>
                    <p className="text-sm text-slate-500">{item.evaluationDate}</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
                    {item.totalScore}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">Trend: {item.trend}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="panel mt-6 p-6">
        <h2 className="text-xl font-semibold text-slate-950">Learning pathway outcomes</h2>
        <p className="mt-2 text-sm text-slate-500">
          Review deadlines, final pathway decisions, and whether later evaluations improved after completion.
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
