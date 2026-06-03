import { useEffect, useState, type FormEvent } from "react";

import { PageHeader } from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";

type Department = {
  id: number;
  departmentName: string;
};

export function DepartmentsPage() {
  const { session } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentName, setDepartmentName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");

  async function loadDepartments() {
    try {
      const response = await api.get<Department[]>("/departments");
      setDepartments(response.data);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Unable to load departments."));
    }
  }

  useEffect(() => {
    void loadDepartments();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      await api.post("/departments", { departmentName });
      setDepartmentName("");
      await loadDepartments();
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to create department."));
    }
  }

  async function handleUpdate(departmentId: number) {
    setError("");

    try {
      await api.put(`/departments/${departmentId}`, { departmentName: editingName });
      setEditingId(null);
      setEditingName("");
      await loadDepartments();
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to update department."));
    }
  }

  async function handleDelete(departmentId: number) {
    if (!window.confirm("Delete this department?")) {
      return;
    }

    setError("");

    try {
      await api.delete(`/departments/${departmentId}`);
      await loadDepartments();
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to delete department."));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Departments"
        title="Department management"
        description="Organize the workforce structure used by employee records, reporting, and performance evaluation workflows."
      />

      <form className="panel mb-6 flex flex-col gap-4 p-6 md:flex-row" onSubmit={handleCreate}>
        <input
          className="input"
          placeholder="Department name"
          value={departmentName}
          onChange={(event) => setDepartmentName(event.target.value)}
        />
        <button className="btn-primary md:min-w-40" type="submit">
          Add department
        </button>
      </form>

      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {departments.map((department) => (
          <article className="panel p-6" key={department.id}>
            {editingId === department.id ? (
              <div className="space-y-4">
                <input
                  className="input"
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                />
                <div className="flex gap-3">
                  <button className="btn-primary" onClick={() => void handleUpdate(department.id)} type="button">
                    Save
                  </button>
                  <button className="btn-secondary" onClick={() => setEditingId(null)} type="button">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-slate-950">{department.departmentName}</h2>
                <p className="mt-2 text-sm text-slate-500">Department ID: {department.id}</p>
                <div className="mt-5 flex gap-3">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setEditingId(department.id);
                      setEditingName(department.departmentName);
                    }}
                    type="button"
                  >
                    Edit
                  </button>
                  {session?.user.role === "admin" ? (
                    <button
                      className="btn-secondary text-rose-600"
                      onClick={() => void handleDelete(department.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
