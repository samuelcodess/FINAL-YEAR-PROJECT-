import { useAuth } from "../../context/AuthContext";
import { AdminDashboardPage } from "./AdminDashboardPage";
import { EmployeeDashboardPage } from "./EmployeeDashboardPage";
import { HrDashboardPage } from "./HrDashboardPage";

export function DashboardPage() {
  const { session } = useAuth();

  if (!session) {
    return null;
  }

  if (session.user.role === "admin") {
    return <AdminDashboardPage />;
  }

  if (session.user.role === "hr_manager") {
    return <HrDashboardPage />;
  }

  return <EmployeeDashboardPage />;
}
