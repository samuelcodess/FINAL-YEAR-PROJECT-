import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const initialToken = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const response = await api.post<{ message: string }>("/auth/reset-password", {
        token,
        password
      });

      setSuccess(response.data.message);
      setToken("");
      setPassword("");
      setConfirmPassword("");
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to reset password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-6">
      <div className="panel w-full max-w-lg p-8">
        <h1 className="font-display text-3xl font-bold text-slate-950">Reset password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Enter the reset token from your email, or use the reset link you were sent, then choose a new password.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input className="input" placeholder="Reset token" value={token} onChange={(event) => setToken(event.target.value)} />
          <input className="input" type="password" placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <input className="input" type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {success ? <p className="text-sm text-brand-700">{success}</p> : null}
          <button className="btn-primary w-full" disabled={loading} type="submit">
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <Link className="mt-4 block text-sm font-medium text-brand-700" to="/login">
          Back to login
        </Link>
      </div>
    </div>
  );
}
