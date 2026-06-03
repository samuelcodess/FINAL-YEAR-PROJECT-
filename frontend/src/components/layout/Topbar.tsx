import { Bell, LogOut, Moon, Sun } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export function Topbar() {
  const { session, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  if (!session) {
    return null;
  }

  return (
    <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-soft md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm text-slate-500">Signed in as</p>
        <h1 className="mt-1 text-xl font-bold text-slate-950">{session.user.fullName}</h1>
        <p className="text-sm text-slate-500">
          {session.user.email} · {session.user.role.replace("_", " ")}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          aria-label="Toggle theme"
          className="btn-secondary h-11 w-11 p-0"
          onClick={toggleTheme}
          title="Toggle theme"
          type="button"
        >
          {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="btn-secondary gap-2" type="button">
          <Bell size={16} />
          Alerts
        </button>
        <button className="btn-primary gap-2" onClick={logout} type="button">
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </header>
  );
}
