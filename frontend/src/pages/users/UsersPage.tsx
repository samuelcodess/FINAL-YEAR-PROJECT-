import { useEffect, useState, type FormEvent } from "react";

import { PageHeader } from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";

type Role = "admin" | "hr_manager" | "employee";

type UserRow = {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  createdAt: string;
  employeeId: number | null;
  employeeCode: string | null;
  departmentName: string | null;
  position: string | null;
};

export function UsersPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetNotice, setResetNotice] = useState<{
    email: string;
    temporaryPassword: string;
  } | null>(null);
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "hr_manager" as Exclude<Role, "employee">
  });
  const [creating, setCreating] = useState(false);
  const pageSize = 10;

  async function loadUsers() {
    try {
      setError("");
      const response = await api.get<{
        items: UserRow[];
        total: number;
      }>("/users", {
        params: {
          q: q || undefined,
          role: role || undefined,
          page,
          pageSize
        }
      });
      setUsers(response.data.items);
      setTotal(response.data.total);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Unable to load users."));
    }
  }

  useEffect(() => {
    void loadUsers();
  }, [page, q, role]);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");
    setResetNotice(null);

    try {
      await api.post("/users", createForm);
      setCreateForm({
        fullName: "",
        email: "",
        password: "",
        role: "hr_manager"
      });
      setSuccess("Account created successfully. The user must change the temporary password at first sign-in.");
      await loadUsers();
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to create user."));
    } finally {
      setCreating(false);
    }
  }

  async function updateRole(userId: number, nextRole: Role) {
    try {
      setError("");
      setSuccess("");
      await api.put(`/users/${userId}/role`, { role: nextRole });
      setSuccess("User role updated successfully.");
      await loadUsers();
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to update user role."));
    }
  }

  async function resetPassword(userId: number, email: string) {
    if (!window.confirm(`Reset the password for ${email}? A new temporary password will be issued.`)) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      const response = await api.post<{
        user: UserRow;
        temporaryPassword: string;
      }>(`/users/${userId}/reset-password`);
      setResetNotice({
        email,
        temporaryPassword: response.data.temporaryPassword
      });
      setSuccess("Temporary password generated successfully.");
      await loadUsers();
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to reset user password."));
    }
  }

  async function deleteUser(userId: number) {
    if (!window.confirm("Delete this user account?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await api.delete(`/users/${userId}`);
      setSuccess("User account deleted successfully.");
      await loadUsers();
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to delete user."));
    }
  }

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div>
      <PageHeader
        eyebrow="Admin users"
        title="User management"
        description="Provision HR and administrator accounts, track password onboarding status, and reset credentials without exposing anyone's current password."
      />

      <section className="panel mb-6 p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-950">Create administrative account</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Employee accounts are created from the employee module. Use this area for HR and administrator access.
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateUser}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
            <input
              className="input"
              value={createForm.fullName}
              onChange={(event) => setCreateForm((current) => ({ ...current, fullName: event.target.value }))}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
            <input
              className="input"
              value={createForm.email}
              onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Temporary password</span>
            <input
              className="input"
              type="password"
              value={createForm.password}
              onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Role</span>
            <select
              className="input"
              value={createForm.role}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  role: event.target.value as Exclude<Role, "employee">
                }))
              }
            >
              <option value="hr_manager">HR manager</option>
              <option value="admin">Administrator</option>
            </select>
          </label>

          <div className="md:col-span-2">
            <button className="btn-primary" disabled={creating} type="submit">
              {creating ? "Creating..." : "Create account"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel mb-6 grid gap-4 p-6 md:grid-cols-[1.4fr_0.8fr_auto]">
        <input
          className="input"
          placeholder="Search by name or email"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
        />
        <select
          className="input"
          value={role}
          onChange={(event) => {
            setRole(event.target.value as Role | "");
            setPage(1);
          }}
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="hr_manager">HR manager</option>
          <option value="employee">Employee</option>
        </select>
        <button
          className="btn-secondary"
          onClick={() => {
            setQ("");
            setRole("");
            setPage(1);
          }}
          type="button"
        >
          Reset
        </button>
      </section>

      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="mb-4 text-sm text-brand-700">{success}</p> : null}
      {resetNotice ? (
        <div className="panel mb-6 border-brand-100 bg-brand-50/60 p-5">
          <p className="text-sm font-semibold text-brand-700">Temporary password issued for {resetNotice.email}</p>
          <p className="mt-2 text-sm text-slate-600">
            Share this once, then ask the user to sign in and change it immediately.
          </p>
          <p className="mt-3 rounded-2xl bg-white px-4 py-3 font-mono text-sm text-slate-900">
            {resetNotice.temporaryPassword}
          </p>
        </div>
      ) : null}

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["User", "Linked employee", "Department", "Role", "Password status", "Created", "Actions"].map((header) => (
                  <th key={header} className="px-4 py-3 text-left font-semibold text-slate-500">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.map((user) => {
                const isCurrentUser = session?.user.id === user.id;

                return (
                  <tr key={user.id}>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-950">{user.fullName}</div>
                      <div className="text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {user.employeeCode ? `${user.employeeCode}${user.position ? ` - ${user.position}` : ""}` : "N/A"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{user.departmentName ?? "N/A"}</td>
                    <td className="px-4 py-4">
                      <select
                        className="input min-w-40"
                        disabled={isCurrentUser}
                        value={user.role}
                        onChange={(event) => void updateRole(user.id, event.target.value as Role)}
                      >
                        <option value="admin">Admin</option>
                        <option value="hr_manager">HR manager</option>
                        <option value="employee">Employee</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={
                          user.mustChangePassword
                            ? "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                            : "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                        }
                      >
                        {user.mustChangePassword ? "Temporary password active" : "User password set"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{user.createdAt}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="btn-secondary"
                          disabled={isCurrentUser}
                          onClick={() => void resetPassword(user.id, user.email)}
                          type="button"
                        >
                          Reset password
                        </button>
                        <button
                          className="btn-secondary text-rose-600"
                          disabled={isCurrentUser}
                          onClick={() => void deleteUser(user.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                    No users matched the current search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          Showing {users.length} of {total} users
        </p>
        <div className="flex gap-3">
          <button
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            type="button"
          >
            Previous
          </button>
          <span className="flex items-center text-sm font-medium text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
