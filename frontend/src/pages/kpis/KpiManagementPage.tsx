import { useEffect, useState, type FormEvent } from "react";

import { PageHeader } from "../../components/common/PageHeader";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";

type Kpi = {
  id: number;
  kpiName: string;
  weightPercentage: number;
  description: string;
};

export function KpiManagementPage() {
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [form, setForm] = useState({
    kpiName: "",
    weightPercentage: "",
    description: ""
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editing, setEditing] = useState({
    kpiName: "",
    weightPercentage: "",
    description: ""
  });
  const [error, setError] = useState("");

  async function loadKpis() {
    const response = await api.get<Kpi[]>("/kpis");
    setKpis(response.data);
  }

  useEffect(() => {
    void loadKpis();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      await api.post("/kpis", {
        ...form,
        weightPercentage: Number(form.weightPercentage)
      });
      setForm({ kpiName: "", weightPercentage: "", description: "" });
      await loadKpis();
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to create KPI."));
    }
  }

  async function handleSave(kpiId: number) {
    setError("");

    try {
      await api.put(`/kpis/${kpiId}`, {
        ...editing,
        weightPercentage: Number(editing.weightPercentage)
      });
      setEditingId(null);
      await loadKpis();
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to update KPI."));
    }
  }

  async function handleDelete(kpiId: number) {
    if (!window.confirm("Delete this KPI?")) {
      return;
    }

    setError("");

    try {
      await api.delete(`/kpis/${kpiId}`);
      await loadKpis();
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to delete KPI."));
    }
  }

  const totalWeight = kpis.reduce((sum, item) => sum + Number(item.weightPercentage), 0);

  return (
    <div>
      <PageHeader
        eyebrow="KPI management"
        title="KPI configuration"
        description="Configure the weighted indicators that drive employee evaluation scoring and recommendation logic."
      />

      <section className="panel mb-6 border border-brand-100 bg-brand-50/60 p-6">
        <h2 className="text-lg font-semibold text-slate-950">How KPI weights work</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The percentage attached to each KPI is its <span className="font-semibold text-slate-950">weight</span>,
          not a bad-performance threshold. A higher weight means that KPI contributes more to the employee&apos;s final
          evaluation score.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white/80 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">Weight example</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              If <span className="font-semibold text-slate-950">Productivity = 25%</span> and{" "}
              <span className="font-semibold text-slate-950">Initiative = 15%</span>, a low score in Productivity affects
              the final result more strongly.
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">Performance thresholds</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Final score ranges are interpreted separately:{" "}
              <span className="font-semibold text-slate-950">90-100 Excellent</span>,{" "}
              <span className="font-semibold text-slate-950">75-89 Very Good</span>,{" "}
              <span className="font-semibold text-slate-950">60-74 Good</span>,{" "}
              <span className="font-semibold text-slate-950">50-59 Average</span>, and{" "}
              <span className="font-semibold text-slate-950">below 50 Poor</span>.
            </p>
          </div>
        </div>
      </section>

      <form className="panel mb-6 grid gap-4 p-6 md:grid-cols-[1.3fr_0.5fr_1.2fr_auto]" onSubmit={handleCreate}>
        <input className="input" placeholder="KPI name" value={form.kpiName} onChange={(event) => setForm((current) => ({ ...current, kpiName: event.target.value }))} />
        <input className="input" placeholder="Weight %" type="number" value={form.weightPercentage} onChange={(event) => setForm((current) => ({ ...current, weightPercentage: event.target.value }))} />
        <input className="input" placeholder="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
        <button className="btn-primary" type="submit">Add KPI</button>
      </form>

      <p className="mb-4 text-sm text-slate-500">Current configured weight: {totalWeight}%</p>
      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {kpis.map((kpi) => (
          <article className="panel p-6" key={kpi.id}>
            {editingId === kpi.id ? (
              <div className="space-y-4">
                <input className="input" value={editing.kpiName} onChange={(event) => setEditing((current) => ({ ...current, kpiName: event.target.value }))} />
                <input className="input" type="number" value={editing.weightPercentage} onChange={(event) => setEditing((current) => ({ ...current, weightPercentage: event.target.value }))} />
                <textarea className="input min-h-24" value={editing.description} onChange={(event) => setEditing((current) => ({ ...current, description: event.target.value }))} />
                <div className="flex gap-3">
                  <button className="btn-primary" onClick={() => void handleSave(kpi.id)} type="button">Save</button>
                  <button className="btn-secondary" onClick={() => setEditingId(null)} type="button">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold text-slate-950">{kpi.kpiName}</h2>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
                    {kpi.weightPercentage}%
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-500">{kpi.description}</p>
                <div className="mt-5 flex gap-3">
                  <button className="btn-secondary" onClick={() => { setEditingId(kpi.id); setEditing({ kpiName: kpi.kpiName, weightPercentage: String(kpi.weightPercentage), description: kpi.description }); }} type="button">Edit</button>
                  <button className="btn-secondary text-rose-600" onClick={() => void handleDelete(kpi.id)} type="button">Delete</button>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
