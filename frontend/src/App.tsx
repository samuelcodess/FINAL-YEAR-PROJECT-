import type { ReactNode } from "react";
import { Route, Routes, Navigate } from "react-router-dom";

import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppShell } from "./components/layout/AppShell";
import type { Role } from "./lib/types";
import { ActivityLogsPage } from "./pages/activity-logs/ActivityLogsPage";
import { ChangePasswordPage } from "./pages/auth/ChangePasswordPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { DepartmentsPage } from "./pages/departments/DepartmentsPage";
import { AddEmployeePage } from "./pages/employees/AddEmployeePage";
import { EmployeeListPage } from "./pages/employees/EmployeeListPage";
import { EmployeeProfilePage } from "./pages/employees/EmployeeProfilePage";
import { EvaluationPage } from "./pages/evaluations/EvaluationPage";
import { KpiManagementPage } from "./pages/kpis/KpiManagementPage";
import { NotificationsPage } from "./pages/notifications/NotificationsPage";
import { ForgotPasswordPage } from "./pages/public/ForgotPasswordPage";
import { LoginPage } from "./pages/public/LoginPage";
import { ResetPasswordPage } from "./pages/public/ResetPasswordPage";
import { RecommendationsPage } from "./pages/recommendations/RecommendationsPage";
import { ResourceDetailPage } from "./pages/resources/ResourceDetailPage";
import { ReportsPage } from "./pages/reports/ReportsPage";
import { SettingsPage } from "./pages/settings/SettingsPage";
import { TaskDetailPage } from "./pages/tasks/TaskDetailPage";
import { TasksPage } from "./pages/tasks/TasksPage";
import { UsersPage } from "./pages/users/UsersPage";

function SecurePage({
  children,
  roles
}: {
  children: ReactNode;
  roles?: Role[];
}) {
  return <ProtectedRoute roles={roles}>{children}</ProtectedRoute>;
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/employees"
            element={
              <SecurePage roles={["admin", "hr_manager"]}>
                <EmployeeListPage />
              </SecurePage>
            }
          />
          <Route
            path="/employees/new"
            element={
              <SecurePage roles={["admin"]}>
                <AddEmployeePage />
              </SecurePage>
            }
          />
          <Route
            path="/employees/:employeeId"
            element={
              <SecurePage roles={["admin", "hr_manager", "employee"]}>
                <EmployeeProfilePage />
              </SecurePage>
            }
          />
          <Route
            path="/departments"
            element={
              <SecurePage roles={["admin", "hr_manager"]}>
                <DepartmentsPage />
              </SecurePage>
            }
          />
          <Route
            path="/users"
            element={
              <SecurePage roles={["admin"]}>
                <UsersPage />
              </SecurePage>
            }
          />
          <Route
            path="/kpis"
            element={
              <SecurePage roles={["admin", "hr_manager"]}>
                <KpiManagementPage />
              </SecurePage>
            }
          />
          <Route
            path="/evaluations"
            element={
              <SecurePage roles={["admin", "hr_manager"]}>
                <EvaluationPage />
              </SecurePage>
            }
          />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/resources/:resourceId" element={<ResourceDetailPage />} />
          <Route
            path="/tasks"
            element={
              <SecurePage roles={["admin", "hr_manager", "employee"]}>
                <TasksPage />
              </SecurePage>
            }
          />
          <Route
            path="/tasks/:taskId"
            element={
              <SecurePage roles={["admin", "hr_manager", "employee"]}>
                <TaskDetailPage />
              </SecurePage>
            }
          />
          <Route
            path="/reports"
            element={
              <SecurePage roles={["admin", "hr_manager"]}>
                <ReportsPage />
              </SecurePage>
            }
          />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route
            path="/activity-logs"
            element={
              <SecurePage roles={["admin"]}>
                <ActivityLogsPage />
              </SecurePage>
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}
