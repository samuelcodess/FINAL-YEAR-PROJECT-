import { useState } from "react";
import type { FormEvent } from "react";
import clsx from "clsx";
import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import axios from "axios";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (submissionError) {
      if (axios.isAxiosError(submissionError)) {
        setError(submissionError.response?.data?.message ?? "Unable to sign in.");
      } else {
        setError(submissionError instanceof Error ? submissionError.message : "Unable to sign in.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={clsx(
        "relative min-h-screen overflow-hidden transition-colors duration-300",
        isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      )}
    >
      <div
        aria-hidden="true"
        className={clsx(
          "absolute inset-0",
          isDark
            ? "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.2),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#111827_100%)]"
            : "bg-hero-grid"
        )}
      />
      <div
        aria-hidden="true"
        className={clsx(
          "absolute inset-x-0 top-0 h-72 blur-3xl",
          isDark ? "bg-brand-500/10" : "bg-white/30"
        )}
      />

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr]">
        <section>
          <div className="flex items-center justify-between gap-4">
            <span
              className={clsx(
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em]",
                isDark
                  ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                  : "bg-white/80 text-brand-700"
              )}
            >
              AI-enhanced HR decision support
            </span>
            <button
              aria-label="Toggle theme"
              className={clsx(
                "inline-flex h-11 w-11 items-center justify-center rounded-full border p-0 transition",
                isDark
                  ? "border-slate-700 bg-slate-900/80 text-slate-100 hover:bg-slate-800"
                  : "border-slate-200 bg-white/85 text-slate-700 hover:bg-white"
              )}
              onClick={toggleTheme}
              title="Toggle theme"
              type="button"
            >
              {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <h1
            className={clsx(
              "mt-6 max-w-3xl font-display text-5xl font-extrabold tracking-tight md:text-7xl",
              isDark ? "text-slate-50" : "text-slate-950"
            )}
          >
            Evaluate employees with clarity. Recommend action with confidence.
          </h1>

          <p
            className={clsx(
              "mt-6 max-w-2xl text-lg leading-8",
              isDark ? "text-slate-300" : "text-slate-600"
            )}
          >
            PerformAI Hub helps HR teams manage employees, score KPI-based evaluations,
            generate explainable recommendations, and monitor performance trends over time.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {[
              "Role-based dashboards",
              "Explainable recommendation logic",
              "Learning-path progress tracking"
            ].map((item) => (
              <span
                key={item}
                className={clsx(
                  "rounded-full px-4 py-2 text-sm font-medium",
                  isDark
                    ? "border border-slate-800 bg-slate-900/70 text-slate-200"
                    : "border border-white/70 bg-white/75 text-slate-700"
                )}
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["Weighted KPI scoring", "Consistent evaluation across departments."],
              ["Rule-based AI guidance", "Academically defendable recommendations with reasons."],
              ["Trend analytics", "Visualize improvement, decline, and intervention outcomes."]
            ].map(([title, description]) => (
              <article
                key={title}
                className={clsx(
                  "rounded-3xl border p-5 backdrop-blur-sm transition-colors",
                  isDark
                    ? "border-slate-800 bg-slate-900/75 shadow-[0_20px_45px_rgba(2,6,23,0.4)]"
                    : "border-white/70 bg-white/75 shadow-soft"
                )}
              >
                <h3 className={clsx("text-lg font-semibold", isDark ? "text-slate-100" : "text-slate-950")}>
                  {title}
                </h3>
                <p className={clsx("mt-3 text-sm leading-6", isDark ? "text-slate-400" : "text-slate-500")}>
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          className={clsx(
            "rounded-[2rem] border p-8 backdrop-blur-md transition-colors",
            isDark
              ? "border-slate-800 bg-slate-900/80 shadow-[0_24px_60px_rgba(2,6,23,0.5)]"
              : "border-white/80 bg-white/90 shadow-soft"
          )}
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Portal access</p>
            <h2 className={clsx("mt-3 font-display text-3xl font-bold", isDark ? "text-slate-50" : "text-slate-950")}>
              Sign in to your workspace
            </h2>
            <p className={clsx("mt-3 text-sm leading-6", isDark ? "text-slate-400" : "text-slate-500")}>
              Admins, HR managers, and employees each enter a role-based dashboard.
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className={clsx("mb-2 block text-sm font-medium", isDark ? "text-slate-200" : "text-slate-700")}>
                Email
              </span>
              <input
                className="input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
              />
            </label>

            <label className="block">
              <span className={clsx("mb-2 block text-sm font-medium", isDark ? "text-slate-200" : "text-slate-700")}>
                Password
              </span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
              />
            </label>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            <button className="btn-primary w-full" disabled={loading} type="submit">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className={clsx("mt-6 flex items-center justify-between text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
            <Link className="font-medium text-brand-700 hover:text-brand-600" to="/forgot-password">
              Forgot password
            </Link>
            <span className={clsx("text-right text-xs leading-5", isDark ? "text-slate-500" : "text-slate-500")}>
              Accounts are provisioned by the administrator.
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
