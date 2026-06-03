import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";
import type { AuthSession } from "../../lib/types";

type Department = {
  id: number;
  departmentName: string;
};

export function RegisterPage() {
  const navigate = useNavigate();
  const { acceptSession } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    employeeCode: "",
    departmentId: "",
    position: "",
    hireDate: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void api.get<Department[]>("/departments").then((response) => setDepartments(response.data));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post<AuthSession>("/auth/register", {
        ...form,
        departmentId: Number(form.departmentId)
      });
      acceptSession(response.data);
      navigate("/dashboard");
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to create account."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-6">
      <div className="panel w-full max-w-2xl p-8">
        <h1 className="font-display text-3xl font-bold text-slate-950">Create employee account</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Register a new employee profile with a linked user account and department assignment.
        </p>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <input className="input" placeholder="Full name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
          <input className="input" placeholder="Email address" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          <input className="input" placeholder="Employee code" value={form.employeeCode} onChange={(event) => setForm((current) => ({ ...current, employeeCode: event.target.value }))} />
          <select className="input" value={form.departmentId} onChange={(event) => setForm((current) => ({ ...current, departmentId: event.target.value }))}>
            <option value="">Select department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.departmentName}</option>
            ))}
          </select>
          <input className="input" placeholder="Position" value={form.position} onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))} />
          <input className="input md:col-span-2" type="date" value={form.hireDate} onChange={(event) => setForm((current) => ({ ...current, hireDate: event.target.value }))} />
          {error ? <p className="md:col-span-2 text-sm text-rose-600">{error}</p> : null}
          <div className="md:col-span-2">
            <button className="btn-primary w-full" disabled={loading} type="submit">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>
        <Link className="mt-4 block text-sm font-medium text-brand-700" to="/login">Back to login</Link>
      </div>
    </div>
  );
}
