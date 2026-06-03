import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";

type Department = {
  id: number;
  departmentName: string;
};

type EmployeeProfile = {
  id: number;
  fullName: string;
  email: string;
  employeeCode: string;
  departmentId: number;
  departmentName: string;
  position: string;
  status: string;
  hireDate: string;
  evaluationHistory: Array<{
    id: number;
    evaluationDate: string;
    totalScore: number;
    performanceLevel: string;
    trend: string;
    remarks: string;
  }>;
};

export function EmployeeProfilePage() {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const { session } = useAuth();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    departmentId: "",
    position: "",
    hireDate: "",
    status: "active"
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isReadOnly = session?.user.role === "employee";

  useEffect(() => {
    if (!employeeId) {
      return;
    }

    void api.get<EmployeeProfile>(`/employees/${employeeId}`).then((response) => setProfile(response.data));
  }, [employeeId]);

  useEffect(() => {
    void api.get<Department[]>("/departments").then((response) => setDepartments(response.data));
  }, []);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setForm({
      fullName: profile.fullName,
      email: profile.email,
      departmentId: String(profile.departmentId),
      position: profile.position,
      hireDate: profile.hireDate,
      status: profile.status
    });
  }, [profile]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!employeeId) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await api.put<EmployeeProfile>(`/employees/${employeeId}`, {
        ...form,
        departmentId: Number(form.departmentId)
      });

      setProfile(response.data);
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to update employee."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!employeeId || !window.confirm("Delete this employee and linked user account?")) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await api.delete(`/employees/${employeeId}`);
      navigate("/employees");
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to delete employee."));
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Employee profile"
        title={profile?.fullName ?? "Employee record"}
        description="Review employment details and historical evaluation performance for the selected employee."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Profile details</h2>
              <p className="mt-2 text-sm text-slate-500">Update employee information and employment status.</p>
            </div>
            {!isReadOnly ? (
              <button className="btn-secondary text-rose-600" disabled={deleting} onClick={handleDelete} type="button">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            ) : null}
          </div>

          <form className="mt-6 grid gap-4 text-sm" onSubmit={handleSave}>
            <label className="block">
              <span className="mb-2 block font-medium text-slate-700">Full name</span>
              <input
                className="input"
                value={form.fullName}
                disabled={isReadOnly}
                onChange={(event) => updateField("fullName", event.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-medium text-slate-700">Email</span>
              <input
                className="input"
                value={form.email}
                disabled={isReadOnly}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-medium text-slate-700">Employee code</span>
              <input className="input bg-slate-50" readOnly value={profile?.employeeCode ?? ""} />
            </label>

            <label className="block">
              <span className="mb-2 block font-medium text-slate-700">Department</span>
              <select
                className="input"
                disabled={isReadOnly}
                value={form.departmentId}
                onChange={(event) => updateField("departmentId", event.target.value)}
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.departmentName}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block font-medium text-slate-700">Position</span>
              <input
                className="input"
                value={form.position}
                disabled={isReadOnly}
                onChange={(event) => updateField("position", event.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-medium text-slate-700">Hire date</span>
              <input
                className="input"
                type="date"
                value={form.hireDate}
                disabled={isReadOnly}
                onChange={(event) => updateField("hireDate", event.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-medium text-slate-700">Status</span>
              <select
                className="input"
                disabled={isReadOnly}
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
              >
                {["active", "on_leave", "inactive", "terminated"].map((status) => (
                  <option key={status} value={status}>
                    {status.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            {!isReadOnly ? (
              <div>
                <button className="btn-primary" disabled={saving} type="submit">
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Employees can review their profile here. HR and admin users manage employment details.
              </p>
            )}
          </form>
        </section>

        <section className="panel p-6">
          <h2 className="text-xl font-semibold text-slate-950">Evaluation history</h2>
          <div className="mt-6 space-y-4">
            {profile?.evaluationHistory.map((item) => (
              <article className="rounded-2xl border border-slate-200 p-4" key={item.id}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-950">{item.performanceLevel.replace("_", " ")}</h3>
                    <p className="text-sm text-slate-500">{item.evaluationDate}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                    {item.totalScore}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">Trend: {item.trend}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.remarks}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
