import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../components/common/PageHeader";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";

type Department = {
  id: number;
  departmentName: string;
};

export function AddEmployeePage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    employeeCode: "",
    departmentId: "",
    position: "",
    hireDate: "",
    status: "active"
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void api.get<Department[]>("/departments").then((response) => setDepartments(response.data));
  }, []);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await api.post<{ id: number }>("/employees", {
        ...form,
        departmentId: Number(form.departmentId)
      });

      navigate(`/employees/${response.data.id}`);
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to create employee."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Employee management"
        title="Add employee"
        description="Create a new employee record, provision the linked user account, and assign the employee to the appropriate department."
      />

      <form className="panel grid gap-4 p-6 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
          <input
            className="input"
            placeholder="Full name"
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
          <input
            className="input"
            placeholder="Email address"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Temporary password</span>
          <input
            className="input"
            type="password"
            placeholder="Temporary password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Employee code</span>
          <input
            className="input"
            placeholder="Employee code"
            value={form.employeeCode}
            onChange={(event) => updateField("employeeCode", event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Department</span>
          <select
            className="input"
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
          <span className="mb-2 block text-sm font-medium text-slate-700">Position</span>
          <input
            className="input"
            placeholder="Position"
            value={form.position}
            onChange={(event) => updateField("position", event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Hire date</span>
          <input
            className="input"
            type="date"
            value={form.hireDate}
            onChange={(event) => updateField("hireDate", event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Status</span>
          <select
            className="input"
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

        <div className="md:col-span-2">
          {error ? <p className="mb-3 text-sm text-rose-600">{error}</p> : null}
          <button className="btn-primary" disabled={saving} type="submit">
            {saving ? "Saving..." : "Save employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
