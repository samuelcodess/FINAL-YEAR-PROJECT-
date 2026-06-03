export const roles = {
  admin: "admin",
  hrManager: "hr_manager",
  employee: "employee"
} as const;

export type AppRole = (typeof roles)[keyof typeof roles];
