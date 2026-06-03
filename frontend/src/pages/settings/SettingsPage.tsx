import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/getApiErrorMessage";

type Role = "admin" | "hr_manager" | "employee";

type SettingsResponse = {
  userPreferences: {
    userId: number;
    themePreference: "light" | "dark" | "system";
    emailNotifications: boolean;
    inAppNotifications: boolean;
    reminderOptIn: boolean;
  };
  systemSettings?: {
    defaultPathwayDeadlineDays: number;
    reminderLeadDays: number;
  };
};

export function SettingsPage() {
  const { session, acceptSession } = useAuth();
  const { themePreference, setThemePreference } = useTheme();
  const [profileForm, setProfileForm] = useState({
    fullName: session?.user.fullName ?? "",
    email: session?.user.email ?? ""
  });
  const [preferenceForm, setPreferenceForm] = useState({
    themePreference,
    emailNotifications: true,
    inAppNotifications: true,
    reminderOptIn: true
  });
  const [systemForm, setSystemForm] = useState({
    defaultPathwayDeadlineDays: "21",
    reminderLeadDays: "3"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingSystem, setSavingSystem] = useState(false);

  useEffect(() => {
    setProfileForm({
      fullName: session?.user.fullName ?? "",
      email: session?.user.email ?? ""
    });
  }, [session]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await api.get<SettingsResponse>("/settings");
        setPreferenceForm({
          themePreference: response.data.userPreferences.themePreference,
          emailNotifications: response.data.userPreferences.emailNotifications,
          inAppNotifications: response.data.userPreferences.inAppNotifications,
          reminderOptIn: response.data.userPreferences.reminderOptIn
        });
        setThemePreference(response.data.userPreferences.themePreference);

        if (response.data.systemSettings) {
          setSystemForm({
            defaultPathwayDeadlineDays: String(response.data.systemSettings.defaultPathwayDeadlineDays),
            reminderLeadDays: String(response.data.systemSettings.reminderLeadDays)
          });
        }
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, "Unable to load settings."));
      }
    }

    void loadSettings();
  }, []);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.put<{
        id: number;
        fullName: string;
        email: string;
        role: Role;
        createdAt: string;
      }>("/users/me", profileForm);

      if (session) {
        acceptSession({
          ...session,
          user: {
            id: response.data.id,
            fullName: response.data.fullName,
            email: response.data.email,
            role: response.data.role,
            mustChangePassword: session.user.mustChangePassword
          }
        });
      }

      setSuccess("Profile details updated successfully.");
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to update profile."));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePreferencesSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPreferences(true);
    setError("");
    setSuccess("");

    try {
      await api.put("/settings/preferences", preferenceForm);
      setThemePreference(preferenceForm.themePreference);
      setSuccess("Preferences updated successfully.");
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to update preferences."));
    } finally {
      setSavingPreferences(false);
    }
  }

  async function handleSystemSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingSystem(true);
    setError("");
    setSuccess("");

    try {
      await api.put("/settings/system", {
        defaultPathwayDeadlineDays: Number(systemForm.defaultPathwayDeadlineDays),
        reminderLeadDays: Number(systemForm.reminderLeadDays)
      });
      setSuccess("Platform settings updated successfully.");
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to update platform settings."));
    } finally {
      setSavingSystem(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="System settings"
        description="Manage your account, appearance preferences, reminder options, and platform behavior from one control center."
      />

      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="mb-4 text-sm text-brand-700">{success}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="text-xl font-semibold text-slate-950">Account profile</h2>
          <form className="mt-6 space-y-4" onSubmit={handleProfileSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
              <input
                className="input"
                value={profileForm.fullName}
                onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
              <input
                className="input"
                value={profileForm.email}
                onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <button className="btn-primary" disabled={savingProfile} type="submit">
              {savingProfile ? "Saving..." : "Save profile"}
            </button>
            <Link className="btn-secondary ml-3 inline-flex" to="/change-password">
              Change password
            </Link>
          </form>
        </section>

        <section className="panel p-6">
          <h2 className="text-xl font-semibold text-slate-950">Workspace overview</h2>
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Role</dt>
              <dd className="font-semibold capitalize text-slate-950">
                {session?.user.role.replace("_", " ") ?? "Unknown"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Employee code</dt>
              <dd className="font-semibold text-slate-950">
                {session?.employeeProfile?.employeeCode ?? "N/A"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Department ID</dt>
              <dd className="font-semibold text-slate-950">
                {session?.employeeProfile?.departmentId ?? "N/A"}
              </dd>
            </div>
          </dl>
          {session?.employeeProfile ? (
            <Link className="btn-secondary mt-6 inline-flex" to={`/employees/${session.employeeProfile.id}`}>
              View my profile
            </Link>
          ) : null}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="text-xl font-semibold text-slate-950">Appearance and notifications</h2>
          <form className="mt-6 space-y-4" onSubmit={handlePreferencesSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Theme</span>
              <select
                className="input"
                value={preferenceForm.themePreference}
                onChange={(event) =>
                  setPreferenceForm((current) => ({
                    ...current,
                    themePreference: event.target.value as "light" | "dark" | "system"
                  }))
                }
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                checked={preferenceForm.emailNotifications}
                type="checkbox"
                onChange={(event) =>
                  setPreferenceForm((current) => ({
                    ...current,
                    emailNotifications: event.target.checked
                  }))
                }
              />
              Email notifications enabled
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                checked={preferenceForm.inAppNotifications}
                type="checkbox"
                onChange={(event) =>
                  setPreferenceForm((current) => ({
                    ...current,
                    inAppNotifications: event.target.checked
                  }))
                }
              />
              In-app notifications enabled
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                checked={preferenceForm.reminderOptIn}
                type="checkbox"
                onChange={(event) =>
                  setPreferenceForm((current) => ({
                    ...current,
                    reminderOptIn: event.target.checked
                  }))
                }
              />
              Learning-path reminders enabled
            </label>
            <button className="btn-primary" disabled={savingPreferences} type="submit">
              {savingPreferences ? "Saving..." : "Save preferences"}
            </button>
          </form>
        </section>

        {session?.user.role === "admin" ? (
          <section className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-950">Platform configuration</h2>
            <form className="mt-6 space-y-4" onSubmit={handleSystemSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Default pathway deadline days
                </span>
                <input
                  className="input"
                  type="number"
                  value={systemForm.defaultPathwayDeadlineDays}
                  onChange={(event) =>
                    setSystemForm((current) => ({
                      ...current,
                      defaultPathwayDeadlineDays: event.target.value
                    }))
                  }
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Reminder lead days</span>
                <input
                  className="input"
                  type="number"
                  value={systemForm.reminderLeadDays}
                  onChange={(event) =>
                    setSystemForm((current) => ({
                      ...current,
                      reminderLeadDays: event.target.value
                    }))
                  }
                />
              </label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Public self-registration is disabled in this administrative mode. New employee and HR
                accounts are provisioned by the administrator and must change their password on first sign-in.
              </div>
              <button className="btn-primary" disabled={savingSystem} type="submit">
                {savingSystem ? "Saving..." : "Save platform settings"}
              </button>
            </form>
          </section>
        ) : null}
      </div>
    </div>
  );
}
