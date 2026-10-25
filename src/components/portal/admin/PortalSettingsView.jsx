"use client";

import { useState } from "react";
import {
  Settings,
  Shield,
  Key,
  CheckCircle2,
  Lock,
  Smartphone,
  Save,
  MessageCircle,
  BarChart3,
} from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import {
  updateSettingsAction,
  updateAdminPasswordAction,
} from "@/server/actions/admin.settings.actions.js";

export default function PortalSettingsView({
  settings = {},
  admin = {},
}) {
  // System config state
  const [workspaceName, setWorkspaceName] = useState(
    settings.workspaceName || "Ronak Sir Workspace"
  );
  const [whatsappNumber, setWhatsappNumber] = useState(
    settings.whatsappNumber || "+91 99999 99999"
  );
  const [defaultDeviceLimit, setDefaultDeviceLimit] = useState(
    settings.defaultDeviceLimit || 1
  );
  const [watermarkEnabled, setWatermarkEnabled] = useState(
    settings.watermarkEnabled !== false
  );
  const [rewardTargetText, setRewardTargetText] = useState(
    settings.rewardTargetText || "₹5,100 Cash Reward Target"
  );
  const [allowStudentPasswordChange, setAllowStudentPasswordChange] = useState(
    settings.allowStudentPasswordChange !== false
  );

  // Website numbers state
  const [studentsMentored, setStudentsMentored] = useState(
    settings.websiteNumbers?.studentsMentored || ""
  );
  const [boardSuccessRate, setBoardSuccessRate] = useState(
    settings.websiteNumbers?.boardSuccessRate || ""
  );
  const [testsEvaluated, setTestsEvaluated] = useState(
    settings.websiteNumbers?.testsEvaluated || ""
  );
  const [recordedLectures, setRecordedLectures] = useState(
    settings.websiteNumbers?.recordedLectures || ""
  );

  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg("");

    try {
      const res = await updateSettingsAction({
        workspaceName,
        whatsappNumber,
        defaultDeviceLimit: Number(defaultDeviceLimit),
        watermarkEnabled,
        rewardTargetText,
        allowStudentPasswordChange,
        websiteNumbers: {
          studentsMentored,
          boardSuccessRate,
          testsEvaluated,
          recordedLectures,
        },
      });

      if (res?.success) {
        setSettingsMsg("Platform settings & website numbers saved successfully.");
      } else {
        setSettingsMsg(res?.error || "Failed to update settings.");
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await updateAdminPasswordAction({
        currentPassword,
        newPassword,
      });

      if (res?.success) {
        setPasswordMsg("Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(res?.error || "Failed to update password.");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="portal-page-container">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--portal-text-main)]">Platform Settings</h1>
        <p className="text-xs text-[var(--portal-text-muted)] mt-1">
          Configure security policies, website numbers, and administrator account details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System & Security Preferences */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[var(--portal-card-border)]">
            <Smartphone className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-[var(--portal-text-main)]">Workspace & Security</h2>
              <p className="text-xs text-[var(--portal-text-muted)]">Device security and student portal settings.</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <FormField label="Workspace Name" hint="Shown in admin navigation header and sidebar.">
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="portal-input"
                required
              />
            </FormField>

            <FormField label="Official WhatsApp Number" hint="Used for automated student enquiry and login links.">
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="portal-input"
                required
              />
            </FormField>

            <FormField label="Default Student Device Limit" hint="Number of devices allowed before approval is triggered.">
              <select
                value={defaultDeviceLimit}
                onChange={(e) => setDefaultDeviceLimit(e.target.value)}
                className="portal-input"
              >
                <option value={1}>1 Device (Strict Security Policy)</option>
                <option value={2}>2 Devices</option>
                <option value={3}>3 Devices</option>
              </select>
            </FormField>

            <FormField label="Cash Reward Banner Text" hint="Shown on the student syllabus coverage card.">
              <input
                type="text"
                value={rewardTargetText}
                onChange={(e) => setRewardTargetText(e.target.value)}
                className="portal-input"
              />
            </FormField>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--portal-text-main)]">
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                  className="rounded accent-[var(--portal-accent-yellow)]"
                />
                <span>Enable dynamic floating student watermark on Vimeo player</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--portal-text-main)]">
                <input
                  type="checkbox"
                  checked={allowStudentPasswordChange}
                  onChange={(e) => setAllowStudentPasswordChange(e.target.checked)}
                  className="rounded accent-[var(--portal-accent-yellow)]"
                />
                <span>Allow students to change password from their Profile page</span>
              </label>
            </div>

            {/* Website Numbers Sub-section */}
            <div className="pt-4 border-t border-[var(--portal-card-border)] space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--portal-text-main)]">
                  Website Numbers (Home Stats Band)
                </h3>
              </div>
              <p className="text-[11px] text-[var(--portal-text-muted)]">
                Leave blank to auto-hide or default. Recorded lectures defaults to actual published count if empty.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Students Mentored" hint="e.g. 1,200+">
                  <input
                    type="text"
                    value={studentsMentored}
                    onChange={(e) => setStudentsMentored(e.target.value)}
                    className="portal-input text-xs"
                    placeholder="e.g. 1,200+"
                  />
                </FormField>

                <FormField label="Board Success Rate" hint="e.g. 98.4%">
                  <input
                    type="text"
                    value={boardSuccessRate}
                    onChange={(e) => setBoardSuccessRate(e.target.value)}
                    className="portal-input text-xs"
                    placeholder="e.g. 98.4%"
                  />
                </FormField>

                <FormField label="Tests Evaluated" hint="e.g. 4,500+">
                  <input
                    type="text"
                    value={testsEvaluated}
                    onChange={(e) => setTestsEvaluated(e.target.value)}
                    className="portal-input text-xs"
                    placeholder="e.g. 4,500+"
                  />
                </FormField>

                <FormField label="Recorded Lectures" hint="Leave blank for real count">
                  <input
                    type="text"
                    value={recordedLectures}
                    onChange={(e) => setRecordedLectures(e.target.value)}
                    className="portal-input text-xs"
                    placeholder="Auto or e.g. 136+"
                  />
                </FormField>
              </div>
            </div>

            {settingsMsg && (
              <p className="text-xs font-bold text-emerald-700">{settingsMsg}</p>
            )}

            <div className="pt-3">
              <Button type="submit" variant="yellow" size="sm" disabled={savingSettings}>
                <Save className="w-3.5 h-3.5" />
                <span>{savingSettings ? "Saving..." : "Save Preferences"}</span>
              </Button>
            </div>
          </form>
        </Card>

        {/* Admin Credentials & Security */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[var(--portal-card-border)]">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-[var(--portal-text-main)]">Admin Account Security</h2>
              <p className="text-xs text-[var(--portal-text-muted)]">Update administrator sign in password.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--portal-bg-page)] border border-[var(--portal-card-border)] mb-5 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-[var(--portal-text-muted)]">Signed in as:</span>
              <strong className="text-[var(--portal-text-main)]">{admin.name || "Administrator"}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--portal-text-muted)]">Login ID:</span>
              <strong className="font-mono text-[var(--portal-text-main)]">{admin.loginId || "admin"}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--portal-text-muted)]">Role:</span>
              <strong className="text-emerald-700 uppercase">Superadmin</strong>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                {passwordError}
              </div>
            )}
            {passwordMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs border border-emerald-200">
                {passwordMsg}
              </div>
            )}

            <FormField label="Current Password" required>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="portal-input"
                required
              />
            </FormField>

            <FormField label="New Password" hint="Minimum 8 characters." required>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="portal-input"
                required
              />
            </FormField>

            <FormField label="Confirm New Password" required>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="portal-input"
                required
              />
            </FormField>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" disabled={savingPassword}>
                <Key className="w-3.5 h-3.5" />
                <span>{savingPassword ? "Updating..." : "Update Password"}</span>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
