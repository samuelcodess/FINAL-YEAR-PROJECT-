import clsx from "clsx";
import { NavLink } from "react-router-dom";

import { navigationByRole } from "../../data/navigation";
import { useAuth } from "../../context/AuthContext";
import { useUnreadSummary } from "../../context/UnreadSummaryContext";

export function Sidebar() {
  const { session } = useAuth();
  const { summary } = useUnreadSummary();

  if (!session) {
    return null;
  }

  const items = navigationByRole[session.user.role];

  function getBadgeCount(path: string) {
    if (path === "/tasks") {
      return summary.task;
    }

    if (path === "/recommendations") {
      return summary.recommendation;
    }

    if (path === "/notifications") {
      return summary.total;
    }

    return 0;
  }

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-white px-6 py-8 lg:flex">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-700">PerformAI Hub</p>
        <h2 className="mt-3 font-display text-2xl font-bold text-slate-950">HR Intelligence Suite</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          KPI-based employee evaluation with explainable recommendations.
        </p>
      </div>

      <nav className="mt-10 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                )
              }
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {getBadgeCount(item.to) > 0 ? (
                <span
                  className={clsx(
                    "min-w-6 rounded-full px-2 py-0.5 text-center text-xs font-semibold",
                    "bg-brand-600 text-white"
                  )}
                >
                  {getBadgeCount(item.to)}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
