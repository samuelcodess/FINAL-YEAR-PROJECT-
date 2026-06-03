import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";

type EmployeeRow = {
  id: number;
  fullName: string;
  email: string;
  employeeCode: string;
  departmentName: string;
  position: string;
  status: string;
  latestEvaluationSummary: string | null;
};

type Department = {
  id: number;
  departmentName: string;
};

export function EmployeeListPage() {
  const { session } = useAuth();
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const pageSize = 8;

  useEffect(() => {
    void api.get<Department[]>("/departments").then((response) => setDepartments(response.data));
  }, []);

  useEffect(() => {
    async function loadEmployees() {
      try {
        setError("");
        const response = await api.get<{
          items: EmployeeRow[];
          total: number;
        }>("/employees", {
          params: {
            q: q || undefined,
            status: status || undefined,
            departmentId: departmentId || undefined,
            page,
            pageSize
          }
        });

        setEmployees(response.data.items);
        setTotal(response.data.total);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, "Unable to load employees."));
      }
    }

    void loadEmployees();
  }, [departmentId, page, q, status]);

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div>
      <PageHeader
        eyebrow="Employee management"
        title="Employee directory"
        description="Review employee records, department placement, current position, and latest evaluation summary."
      />

      {session?.user.role === "admin" ? (
        <div className="mb-6 flex justify-end">
          <Link className="btn-primary" to="/employees/new">
            Add employee
          </Link>
        </div>
      ) : null}

      <section className="panel mb-6 grid gap-4 p-6 md:grid-cols-[1.4fr_0.8fr_1fr_auto]">
        <input
          className="input"
          placeholder="Search name, email, or employee code"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
        />
        <select
          className="input"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="on_leave">On leave</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
        </select>
        <select
          className="input"
          value={departmentId}
          onChange={(event) => {
            setDepartmentId(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.departmentName}
            </option>
          ))}
        </select>
        <button
          className="btn-secondary"
          onClick={() => {
            setQ("");
            setStatus("");
            setDepartmentId("");
            setPage(1);
          }}
          type="button"
        >
          Reset
        </button>
      </section>

      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Employee", "Department", "Position", "Status", "Latest summary", "Action"].map((header) => (
                  <th key={header} className="px-6 py-4 text-left font-semibold text-slate-500">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-950">{employee.fullName}</div>
                    <div className="text-slate-500">{employee.email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{employee.departmentName}</td>
                  <td className="px-6 py-4 text-slate-600">{employee.position}</td>
                  <td className="px-6 py-4 capitalize text-slate-600">{employee.status}</td>
                  <td className="px-6 py-4 text-slate-500">{employee.latestEvaluationSummary ?? "No evaluations yet"}</td>
                  <td className="px-6 py-4">
                    <Link className="font-medium text-brand-700" to={`/employees/${employee.id}`}>
                      View profile
                    </Link>
                  </td>
                </tr>
              ))}
              {employees.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-slate-500" colSpan={6}>
                    No employees matched the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          Showing {employees.length} of {total} employees
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
