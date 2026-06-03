import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { session, acceptSession, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation must match.");
      return;
    }

    setSaving(true);

    try {
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword
      });

      if (session) {
        acceptSession({
          ...session,
          user: {
            ...session.user,
            mustChangePassword: false
          }
        });
      }

      setSuccess("Password changed successfully. Redirecting to your dashboard...");
      window.setTimeout(() => navigate("/dashboard"), 900);
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to change password."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-6 py-10">
      <div className="panel w-full max-w-xl p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Password update required</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-slate-950">Set a personal password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Accounts created or reset by the administrator use temporary credentials. You must choose a
          personal password before using the rest of the system.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Current temporary password</span>
            <input
              className="input"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">New password</span>
            <input
              className="input"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Confirm new password</span>
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {success ? <p className="text-sm text-brand-700">{success}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" disabled={saving} type="submit">
              {saving ? "Updating..." : "Update password"}
            </button>
            <button className="btn-secondary" onClick={logout} type="button">
              Sign out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
