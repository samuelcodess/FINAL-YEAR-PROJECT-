import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "../../components/common/PageHeader";
import { getResourceCompletionPercentage } from "../../data/resourceLibrary";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";

type Evaluation = {
  id: number;
  employeeId: number;
  employeeName: string;
  departmentName: string;
  evaluationDate: string;
  totalScore: number;
  performanceLevel: string;
  trend: string;
  recommendation: string;
  aiSummary?: string;
  evaluationMode?: string;
};

type EmployeeOption = {
  id: number;
  fullName: string;
  employeeCode: string;
  departmentName: string;
};

type Kpi = {
  id: number;
  kpiName: string;
  weightPercentage: number;
  description: string;
};

type SubmissionResult = {
  evaluationId: number;
  employeeId: number;
  totalScore: number;
  performanceLevel: string;
  trend: string;
  recommendationTypes: string[];
  explanation: string;
  aiSummary: string;
  evaluationSource: string;
  strengths: string[];
  risks: string[];
  evaluatedDetails: Array<{
    kpiId: number;
    kpiName: string;
    score: number;
    rationale: string;
  }>;
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
  }>;
};

export function EvaluationPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [form, setForm] = useState({
    employeeId: "",
    evaluationDate: "",
    remarks: "",
    evidence: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  async function loadPageData() {
    try {
      setError("");

      const [evaluationResponse, employeeResponse, kpiResponse] = await Promise.all([
        api.get<Evaluation[]>("/evaluations"),
        api.get<{
          items: EmployeeOption[];
          total: number;
        }>("/employees"),
        api.get<Kpi[]>("/kpis")
      ]);

      setEvaluations(evaluationResponse.data);
      setEmployees(employeeResponse.data.items);
      setKpis(kpiResponse.data);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Unable to load evaluation data."));
    }
  }

  useEffect(() => {
    void loadPageData();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSubmissionResult(null);

    try {
      const payload = {
        employeeId: Number(form.employeeId),
        evaluationDate: form.evaluationDate,
        remarks: form.remarks,
        evidence: form.evidence
      };

      const response = await api.post<SubmissionResult>("/evaluations", payload);
      setSubmissionResult(response.data);
      setForm({
        employeeId: "",
        evaluationDate: "",
        remarks: "",
        evidence: ""
      });
      await loadPageData();
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to submit evaluation."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Evaluations"
        title="Evaluation management"
        description="Submit evidence for AI-assisted KPI evaluation and review the recommendation outcome."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="panel p-6">
          <h2 className="text-xl font-semibold text-slate-950">New AI evaluation</h2>
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Employee</span>
              <select
                className="input"
                value={form.employeeId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    employeeId: event.target.value
                  }))
                }
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName} | {employee.departmentName} | {employee.employeeCode}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Evaluation date</span>
              <input
                className="input"
                type="date"
                value={form.evaluationDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    evaluationDate: event.target.value
                  }))
                }
              />
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">AI scoring rubric</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The AI will score the employee against the configured KPIs using the evidence you provide below.
                Include completed work, measurable outcomes, quality signals, collaboration notes, delays, and
                any issues that should influence the result.
              </p>
              <div className="mt-4 grid gap-3">
                {kpis.map((kpi) => (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3" key={kpi.id}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-950">{kpi.kpiName}</p>
                      <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">
                        {kpi.weightPercentage}%
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{kpi.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Evaluation evidence</span>
              <textarea
                className="input min-h-40"
                placeholder="Describe the employee's completed tasks, quality of work, timeliness, communication, initiative, strengths, and any recurring issues. The AI will use this evidence to score each KPI."
                value={form.evidence}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    evidence: event.target.value
                  }))
                }
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Additional manager remarks</span>
              <textarea
                className="input min-h-28"
                placeholder="Optional notes for extra context"
                value={form.remarks}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    remarks: event.target.value
                  }))
                }
              />
            </label>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            {submissionResult ? (
              <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">
                  AI evaluation saved with score {submissionResult.totalScore} and a{" "}
                  {submissionResult.performanceLevel.replace("_", " ")} rating.
                </p>
                <p className="mt-2">{submissionResult.aiSummary}</p>
                <p className="mt-2">Trend: {submissionResult.trend}</p>
                <p className="mt-2">Evaluation source: {submissionResult.evaluationSource.split("_").join(" ")}</p>
                <p className="mt-2">Recommendations: {submissionResult.recommendationTypes.join(", ")}</p>
                <p className="mt-2">{submissionResult.explanation}</p>
                {submissionResult.strengths.length > 0 ? (
                  <p className="mt-2">Strengths: {submissionResult.strengths.join(", ")}</p>
                ) : null}
                {submissionResult.risks.length > 0 ? (
                  <p className="mt-2">Risks: {submissionResult.risks.join(", ")}</p>
                ) : null}
                {submissionResult.focusAreas.length > 0 ? (
                  <p className="mt-2">
                    Focus areas:{" "}
                    {submissionResult.focusAreas.map((item) => `${item.kpiName} (${item.score})`).join(", ")}
                  </p>
                ) : null}
                {submissionResult.evaluatedDetails.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <p className="font-semibold text-slate-950">AI KPI breakdown</p>
                    {submissionResult.evaluatedDetails.map((detail) => (
                      <div className="rounded-2xl border border-brand-200 bg-white/70 p-3" key={detail.kpiId}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-slate-950">{detail.kpiName}</p>
                          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                            {detail.score}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{detail.rationale}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                {submissionResult.materials.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <p className="font-semibold text-slate-950">Recommended learning pathways</p>
                    {submissionResult.materials.map((material) => (
                      <div className="rounded-2xl border border-brand-200 bg-white/70 p-3" key={material.id}>
                        <p className="font-medium text-slate-950">{material.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{material.description}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                          {material.targetArea} - {material.estimatedDuration} - {material.actionType}
                        </p>
                        <div className="mt-2">
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
                        <Link
                          className="mt-3 inline-flex text-sm font-medium text-brand-700"
                          to={`${material.resourceUrl}?employeeId=${submissionResult.employeeId}`}
                        >
                          Open pathway and assign evidence work
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <button className="btn-primary mt-2" disabled={saving} type="submit">
              {saving ? "Submitting..." : "Run AI evaluation"}
            </button>
          </form>
        </section>

        <section className="panel p-6">
          <h2 className="text-xl font-semibold text-slate-950">Recent evaluations</h2>
          <div className="mt-6 space-y-4">
            {evaluations.map((evaluation) => (
              <article className="rounded-2xl border border-slate-200 p-4" key={evaluation.id}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-950">{evaluation.employeeName}</h3>
                    <p className="text-sm text-slate-500">
                      {evaluation.departmentName} | {evaluation.evaluationDate}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-700">
                    {evaluation.totalScore}
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium capitalize text-slate-700">
                  {evaluation.performanceLevel.replace("_", " ")}
                </p>
                {evaluation.aiSummary ? (
                  <p className="mt-3 text-sm leading-6 text-slate-500">{evaluation.aiSummary}</p>
                ) : null}
                <p className="mt-3 text-sm text-slate-500">Trend: {evaluation.trend}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{evaluation.recommendation}</p>
              </article>
            ))}
            {evaluations.length === 0 ? (
              <p className="text-sm text-slate-500">No evaluations have been submitted yet.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
