export type Role = "admin" | "hr_manager" | "employee";

export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
  employeeProfile: {
    id: number;
    employeeCode: string;
    departmentId: number;
    position: string;
    hireDate: string;
    status: string;
  } | null;
};

export type DashboardMetrics = Record<string, number>;
