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
    details: {} as Record<number, string>
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
      setForm((current) => ({
        ...current,
        details: Object.fromEntries(
          kpiResponse.data.map((kpi) => [kpi.id, current.details[kpi.id] ?? ""])
        )
      }));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Unable to load evaluation data."));
    }
  }

  useEffect(() => {
    void loadPageData();
  }, []);

  function updateDetail(kpiId: number, value: string) {
    setForm((current) => ({
      ...current,
      details: {
        ...current.details,
        [kpiId]: value
      }
    }));
  }

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
        details: kpis.map((kpi) => ({
          kpiId: kpi.id,
          score: Number(form.details[kpi.id] ?? 0)
        }))
      };

      const response = await api.post<SubmissionResult>("/evaluations", payload);
      setSubmissionResult(response.data);
      setForm({
        employeeId: "",
        evaluationDate: "",
        remarks: "",
        details: Object.fromEntries(kpis.map((kpi) => [kpi.id, ""]))
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
        description="Review submitted evaluations and prepare new KPI-based performance assessments."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="panel p-6">
          <h2 className="text-xl font-semibold text-slate-950">New evaluation form</h2>
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

            {kpis.map((kpi) => (
              <label className="block" key={kpi.id}>
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  {kpi.kpiName} ({kpi.weightPercentage}%)
                </span>
                <input
                  className="input"
                  max={100}
                  min={0}
                  placeholder={`Score for ${kpi.kpiName}`}
                  type="number"
                  value={form.details[kpi.id] ?? ""}
                  onChange={(event) => updateDetail(kpi.id, event.target.value)}
                />
              </label>
            ))}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Remarks</span>
              <textarea
                className="input min-h-28"
                placeholder="Optional remarks"
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
                  Evaluation saved with score {submissionResult.totalScore} and a{" "}
                  {submissionResult.performanceLevel.replace("_", " ")} rating.
                </p>
                <p className="mt-2">Trend: {submissionResult.trend}</p>
                <p className="mt-2">Recommendations: {submissionResult.recommendationTypes.join(", ")}</p>
                <p className="mt-2">{submissionResult.explanation}</p>
                {submissionResult.focusAreas.length > 0 ? (
                  <p className="mt-2">
                    Focus areas:{" "}
                    {submissionResult.focusAreas.map((item) => `${item.kpiName} (${item.score})`).join(", ")}
                  </p>
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
              {saving ? "Submitting..." : "Calculate and submit"}
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
