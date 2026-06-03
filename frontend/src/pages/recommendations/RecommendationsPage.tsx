import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "../../components/common/PageHeader";
import { useUnreadSummary } from "../../context/UnreadSummaryContext";
import { getResourceCompletionPercentage } from "../../data/resourceLibrary";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";

type Recommendation = {
  id: number;
  employeeId: number;
  employeeName: string;
  recommendationType: string;
  explanation: string;
  focusAreas: Array<{
    kpiName: string;
    score: number;
  }>;
  materials: Array<{
    id: string;
    resourceId: string;
    resourceUrl: string;
    title: string;
    description: string;
    format: string;
    targetArea: string;
    estimatedDuration: string;
    actionType: string;
    completedModuleIndexes: number[];
    assignedAt: string | null;
    dueDate: string | null;
    completionDecision: "in_progress" | "completed" | "follow_up_required";
    improvementDelta: number | null;
  }>;
};
type RecommendationView = "active" | "history";

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

function splitRecommendationsByCompletion(recommendations: Recommendation[]) {
  const active: Recommendation[] = [];
  const history: Recommendation[] = [];

  for (const item of recommendations) {
    if (item.materials.length === 0) {
      active.push(item);
      continue;
    }

    const activeMaterials = item.materials.filter((material) => material.completionDecision !== "completed");
    const completedMaterials = item.materials.filter((material) => material.completionDecision === "completed");

    if (activeMaterials.length > 0) {
      active.push({
        ...item,
        materials: activeMaterials
      });
    }

    if (completedMaterials.length > 0) {
      history.push({
        ...item,
        materials: completedMaterials
      });
    }
  }

  return { active, history };
}

export function RecommendationsPage() {
  const { refreshSummary } = useUnreadSummary();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState("");
  const [view, setView] = useState<RecommendationView>("active");

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const response = await api.get<Recommendation[]>("/recommendations");
        setRecommendations(response.data);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, "Unable to load recommendations."));
      }
    }

    void loadRecommendations();
  }, []);

  useEffect(() => {
    async function markRecommendationAlertsRead() {
      try {
        await api.patch("/notifications/read-category/recommendation");
        await refreshSummary();
      } catch {
        // Keep the recommendation page usable even if badge refresh fails.
      }
    }

    void markRecommendationAlertsRead();
  }, [refreshSummary]);

  const groupedRecommendations = splitRecommendationsByCompletion(recommendations);
  const visibleRecommendations =
    view === "active" ? groupedRecommendations.active : groupedRecommendations.history;

  return (
    <div>
      <PageHeader
        eyebrow="Recommendations"
        title="AI-assisted recommendations"
        description="Review the interventions suggested by the rule-based decision engine and the reasons attached to each action."
      />

      <section className="panel mb-6 flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex gap-2 rounded-full bg-slate-100 p-1">
          <button
            className={view === "active" ? "btn-primary" : "rounded-full px-4 py-2 text-sm font-medium text-slate-600"}
            onClick={() => setView("active")}
            type="button"
          >
            Active recommendations
          </button>
          <button
            className={view === "history" ? "btn-primary" : "rounded-full px-4 py-2 text-sm font-medium text-slate-600"}
            onClick={() => setView("history")}
            type="button"
          >
            Recommendation history
          </button>
        </div>
        <p className="text-sm text-slate-500">
          {view === "active"
            ? "Completed pathways are hidden from the active queue so employees and HR only see what still needs attention."
            : "Finished recommendation pathways stay here as a clean history of what was completed."}
        </p>
      </section>

      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {visibleRecommendations.map((item) => (
          <article className="panel p-6" key={item.id}>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
              {item.recommendationType.split("_").join(" ")}
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-900">{item.employeeName}</p>
            <p className="mt-4 text-sm leading-7 text-slate-500">{truncateText(item.explanation, 150)}</p>
            {item.focusAreas.length > 0 ? (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-900">Focus areas</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.focusAreas.slice(0, 2).map((area) => (
                    <span
                      className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                      key={`${item.id}-${area.kpiName}`}
                    >
                      {area.kpiName}: {area.score}
                    </span>
                  ))}
                  {item.focusAreas.length > 2 ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      +{item.focusAreas.length - 2} more
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
            {item.materials.length > 0 ? (
              <div className="mt-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">Suggested learning pathways</h3>
                {item.materials.map((material) => (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4" key={material.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">{material.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                          {material.targetArea} - {material.estimatedDuration}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-600">
                        {getDecisionLabel(material.completionDecision)}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>Progress</span>
                        <span>
                          {getResourceCompletionPercentage(
                            material.resourceId,
                            material.completedModuleIndexes
                          )}
                          %
                        </span>
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
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                      <span>{material.format}</span>
                      <span>Deadline: {material.dueDate ?? "Not set"}</span>
                    </div>
                    <Link
                      className="btn-secondary mt-3 inline-flex"
                      to={`${material.resourceUrl}?employeeId=${item.employeeId}`}
                    >
                      Open details
                    </Link>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {visibleRecommendations.length === 0 ? (
        <section className="panel mt-6 p-6 text-sm text-slate-500">
          {view === "active"
            ? "There are no open recommendation pathways right now."
            : "No completed recommendation pathways are in history yet."}
        </section>
      ) : null}
    </div>
  );
}
