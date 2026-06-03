import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { MetricCard } from "../../components/common/MetricCard";
import { PageHeader } from "../../components/common/PageHeader";
import { getResourceCompletionPercentage } from "../../data/resourceLibrary";
import { api } from "../../lib/api";

type EmployeeDashboard = {
  latestEvaluation: {
    totalScore: number;
    performanceLevel: string;
    trend: string;
  } | null;
  evaluationHistory: Array<{
    id: number;
    evaluationDate: string;
    totalScore: number;
  }>;
  recommendations: Array<{
    id: number;
    recommendationType: string;
    explanation: string;
    materials: Array<{
      id: string;
      resourceId: string;
      resourceUrl: string;
      title: string;
      format: string;
      estimatedDuration: string;
      completedModuleIndexes: number[];
      assignedAt: string | null;
      dueDate: string | null;
      completionDecision: "in_progress" | "completed" | "follow_up_required";
      improvementDelta: number | null;
    }>;
  }>;
};

function getDecisionLabel(decision: "in_progress" | "completed" | "follow_up_required") {
  if (decision === "completed") {
    return "Completed";
  }

  if (decision === "follow_up_required") {
    return "Follow-up required";
  }

  return "In progress";
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

const dashboardRecommendationLimit = 2;

function filterActiveRecommendations(
  recommendations: EmployeeDashboard["recommendations"] | undefined
) {
  return (recommendations ?? [])
    .map((item) => {
      const activeMaterials = item.materials.filter((material) => material.completionDecision !== "completed");

      return {
        ...item,
        materials: activeMaterials,
        hasOriginalMaterials: item.materials.length > 0
      };
    })
    .filter((item) => item.materials.length > 0 || !item.hasOriginalMaterials)
    .map(({ hasOriginalMaterials: _hasOriginalMaterials, ...item }) => item);
}

export function EmployeeDashboardPage() {
  const [data, setData] = useState<EmployeeDashboard | null>(null);

  useEffect(() => {
    void api.get<EmployeeDashboard>("/dashboard/employee").then((response) => setData(response.data));
  }, []);

  const activeRecommendations = filterActiveRecommendations(data?.recommendations);
  const visibleRecommendations = activeRecommendations.slice(0, dashboardRecommendationLimit);
  const totalActivePathways = activeRecommendations.reduce((sum, item) => sum + item.materials.length, 0);
  const totalCompletedPathways = (data?.recommendations ?? []).reduce(
    (sum, item) =>
      sum + item.materials.filter((material) => material.completionDecision === "completed").length,
    0
  );

  return (
    <div>
      <PageHeader
        eyebrow="Employee dashboard"
        title="Your performance progress and recommendations"
        description="Review your latest score, track your evaluation history, and understand what action is recommended next."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Latest score"
          value={data?.latestEvaluation?.totalScore ?? "N/A"}
          helper="Most recent weighted evaluation result"
        />
        <MetricCard
          label="Performance level"
          value={data?.latestEvaluation?.performanceLevel.replace("_", " ") ?? "N/A"}
          helper="Current score classification"
        />
        <MetricCard
          label="Trend"
          value={data?.latestEvaluation?.trend ?? "N/A"}
          helper="Direction compared with prior evaluations"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="panel p-6">
          <h2 className="text-xl font-semibold text-slate-950">Performance trend</h2>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.evaluationHistory ?? []}>
                <XAxis dataKey="evaluationDate" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="totalScore" stroke="#1f8f6a" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Recommendation summary</h2>
              <p className="mt-2 text-sm text-slate-500">
                The dashboard only shows a short view of your open pathways so this page stays focused.
              </p>
            </div>
            <Link className="btn-secondary" to="/recommendations">
              View full recommendations
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Open pathways</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{totalActivePathways}</p>
              <p className="mt-1 text-sm text-slate-500">Items still needing attention</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Completed pathways</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{totalCompletedPathways}</p>
              <p className="mt-1 text-sm text-slate-500">Moved to recommendation history</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {visibleRecommendations.map((item) => (
              <article className="rounded-2xl border border-slate-200 p-4" key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold capitalize text-slate-950">
                      {item.recommendationType.split("_").join(" ")}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{truncateText(item.explanation, 90)}</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                    {item.materials.length} open
                  </span>
                </div>
                {item.materials.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {item.materials.slice(0, 2).map((material) => (
                      <div className="rounded-xl bg-slate-50 px-3 py-3" key={material.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{material.title}</p>
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                              {material.format} - {material.estimatedDuration}
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-600">
                            {getDecisionLabel(material.completionDecision)}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <span>
                            Progress:{" "}
                            {getResourceCompletionPercentage(material.resourceId, material.completedModuleIndexes)}%
                          </span>
                          <span>Deadline: {material.dueDate ?? "Not set"}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-slate-200">
                          <div
                            className="h-2 rounded-full bg-brand-600 transition-all"
                            style={{
                              width: `${getResourceCompletionPercentage(
                                material.resourceId,
                                material.completedModuleIndexes
                              )}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {item.materials.length > 2 ? (
                      <p className="text-xs text-slate-500">
                        +{item.materials.length - 2} more open pathway{item.materials.length - 2 === 1 ? "" : "s"} on
                        the full recommendations page.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))}
            {activeRecommendations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No active recommendation pathways are waiting right now.
              </div>
            ) : null}
            {activeRecommendations.length > dashboardRecommendationLimit ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                {activeRecommendations.length - dashboardRecommendationLimit} more recommendation groups are hidden
                here to keep the dashboard neat. Open the full recommendations page to review everything.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
