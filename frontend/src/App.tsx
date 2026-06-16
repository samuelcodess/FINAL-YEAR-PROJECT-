import { lazy, Suspense, type ReactNode } from "react";
import { Route, Routes, Navigate } from "react-router-dom";

import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppShell } from "./components/layout/AppShell";
import type { Role } from "./lib/types";

const ActivityLogsPage = lazy(() =>
  import("./pages/activity-logs/ActivityLogsPage").then((module) => ({ default: module.ActivityLogsPage }))
);
const ChangePasswordPage = lazy(() =>
  import("./pages/auth/ChangePasswordPage").then((module) => ({ default: module.ChangePasswordPage }))
);
const DashboardPage = lazy(() =>
  import("./pages/dashboard/DashboardPage").then((module) => ({ default: module.DashboardPage }))
);
const DepartmentsPage = lazy(() =>
  import("./pages/departments/DepartmentsPage").then((module) => ({ default: module.DepartmentsPage }))
);
const AddEmployeePage = lazy(() =>
  import("./pages/employees/AddEmployeePage").then((module) => ({ default: module.AddEmployeePage }))
);
const EmployeeListPage = lazy(() =>
  import("./pages/employees/EmployeeListPage").then((module) => ({ default: module.EmployeeListPage }))
);
const EmployeeProfilePage = lazy(() =>
  import("./pages/employees/EmployeeProfilePage").then((module) => ({ default: module.EmployeeProfilePage }))
);
const EvaluationPage = lazy(() =>
  import("./pages/evaluations/EvaluationPage").then((module) => ({ default: module.EvaluationPage }))
);
const KpiManagementPage = lazy(() =>
  import("./pages/kpis/KpiManagementPage").then((module) => ({ default: module.KpiManagementPage }))
);
const NotificationsPage = lazy(() =>
  import("./pages/notifications/NotificationsPage").then((module) => ({ default: module.NotificationsPage }))
);
const ForgotPasswordPage = lazy(() =>
  import("./pages/public/ForgotPasswordPage").then((module) => ({ default: module.ForgotPasswordPage }))
);
const LoginPage = lazy(() =>
  import("./pages/public/LoginPage").then((module) => ({ default: module.LoginPage }))
);
const ResetPasswordPage = lazy(() =>
  import("./pages/public/ResetPasswordPage").then((module) => ({ default: module.ResetPasswordPage }))
);
const RecommendationsPage = lazy(() =>
  import("./pages/recommendations/RecommendationsPage").then((module) => ({ default: module.RecommendationsPage }))
);
const ResourceDetailPage = lazy(() =>
  import("./pages/resources/ResourceDetailPage").then((module) => ({ default: module.ResourceDetailPage }))
);
const ReportsPage = lazy(() =>
  import("./pages/reports/ReportsPage").then((module) => ({ default: module.ReportsPage }))
);
const SettingsPage = lazy(() =>
  import("./pages/settings/SettingsPage").then((module) => ({ default: module.SettingsPage }))
);
const TaskDetailPage = lazy(() =>
  import("./pages/tasks/TaskDetailPage").then((module) => ({ default: module.TaskDetailPage }))
);
const TasksPage = lazy(() =>
  import("./pages/tasks/TasksPage").then((module) => ({ default: module.TasksPage }))
);
const UsersPage = lazy(() =>
  import("./pages/users/UsersPage").then((module) => ({ default: module.UsersPage }))
);

function PageLoader() {
  return (
    <div className="panel p-6 text-sm text-slate-500">
      Loading page...
    </div>
  );
}

function withPageLoader(children: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

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
        {withPageLoader(
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
        )}
      </AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  );
}
