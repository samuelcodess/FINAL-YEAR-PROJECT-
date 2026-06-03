import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post<{ message: string }>("/auth/forgot-password", {
        email
      });
      setMessage(response.data.message);
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to start password recovery."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-6">
      <div className="panel w-full max-w-lg p-8">
        <h1 className="font-display text-3xl font-bold text-slate-950">Forgot password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Enter your email address and, if recovery email is enabled, reset instructions will be sent to your inbox.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input className="input" placeholder="Enter your email address" value={email} onChange={(event) => setEmail(event.target.value)} />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {message ? <p className="text-sm text-brand-700">{message}</p> : null}
          <button className="btn-primary w-full" disabled={loading} type="submit">
            {loading ? "Sending..." : "Send reset instructions"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link className="font-medium text-brand-700" to="/reset-password">Enter reset token</Link>
          <Link className="font-medium text-brand-700" to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
