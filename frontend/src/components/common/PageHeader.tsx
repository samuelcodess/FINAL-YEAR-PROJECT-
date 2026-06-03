export function PageHeader({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8">
      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
        {eyebrow}
      </span>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 md:text-base">{description}</p>
    </div>
  );
}
