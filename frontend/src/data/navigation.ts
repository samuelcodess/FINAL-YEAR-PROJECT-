import {
  Building2,
  Bell,
  ClipboardCheck,
  ClipboardList,
  Gauge,
  History,
  LineChart,
  Settings,
  ShieldCheck,
  Target,
  UserCog,
  Users
} from "lucide-react";

import type { Role } from "../lib/types";

export const navigationByRole: Record<
  Role,
  Array<{ label: string; to: string; icon: typeof Gauge }>
> = {
  admin: [
    { label: "Dashboard", to: "/dashboard", icon: Gauge },
    { label: "Employees", to: "/employees", icon: Users },
    { label: "Departments", to: "/departments", icon: Building2 },
    { label: "Users", to: "/users", icon: UserCog },
    { label: "KPIs", to: "/kpis", icon: Target },
    { label: "Tasks", to: "/tasks", icon: ClipboardList },
    { label: "Recommendations", to: "/recommendations", icon: ShieldCheck },
    { label: "Reports", to: "/reports", icon: LineChart },
    { label: "Audit Logs", to: "/activity-logs", icon: History },
    { label: "Notifications", to: "/notifications", icon: Bell },
    { label: "Settings", to: "/settings", icon: Settings }
  ],
  hr_manager: [
    { label: "Dashboard", to: "/dashboard", icon: Gauge },
    { label: "Employees", to: "/employees", icon: Users },
    { label: "Departments", to: "/departments", icon: Building2 },
    { label: "Evaluations", to: "/evaluations", icon: ClipboardCheck },
    { label: "KPIs", to: "/kpis", icon: Target },
    { label: "Tasks", to: "/tasks", icon: ClipboardList },
    { label: "Recommendations", to: "/recommendations", icon: ShieldCheck },
    { label: "Reports", to: "/reports", icon: LineChart },
    { label: "Notifications", to: "/notifications", icon: Bell }
  ],
  employee: [
    { label: "Dashboard", to: "/dashboard", icon: Gauge },
    { label: "Tasks", to: "/tasks", icon: ClipboardList },
    { label: "Recommendations", to: "/recommendations", icon: ShieldCheck },
    { label: "Notifications", to: "/notifications", icon: Bell },
    { label: "Settings", to: "/settings", icon: Settings }
  ]
};
