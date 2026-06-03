import { ArrowUpRight } from "lucide-react";

export function MetricCard({
  label,
  value,
  helper
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <h3 className="mt-3 text-3xl font-bold text-slate-950">{value}</h3>
        </div>
        <span className="rounded-2xl bg-brand-50 p-3 text-brand-700">
          <ArrowUpRight size={18} />
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500">{helper}</p>
    </article>
  );
}
