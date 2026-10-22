"use client";

import { useState } from "react";
import {
  X,
  UserPlus,
  RefreshCw,
  Copy,
  Check,
  MessageCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { createStudentAction } from "@/server/actions/admin.students.actions.js";

export default function CreateStudentModal({
  availableCourses = [],
  nextLoginIdHint = "rd1001",
  onClose,
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loginId, setLoginId] = useState(nextLoginIdHint);
  const [password, setPassword] = useState("");
  const [deviceLimit, setDeviceLimit] = useState(1);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdResult, setCreatedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Generate readable password
  const generatePassword = () => {
    const chars = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars[Math.floor(Math.random() * chars.length)];
    }
    setPassword(pwd);
  };

  const handleCourseToggle = (cId) => {
    if (selectedCourses.includes(cId)) {
      setSelectedCourses(selectedCourses.filter((id) => id !== cId));
    } else {
      setSelectedCourses([...selectedCourses, cId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const fd = new FormData();
    fd.append("name", name);
    fd.append("phone", phone);
    fd.append("loginId", loginId);
    fd.append("password", password);
    fd.append("deviceLimit", deviceLimit.toString());
    if (mustChangePassword) fd.append("mustChangePassword", "on");
    selectedCourses.forEach((cId) => fd.append("courseIds", cId));

    const res = await createStudentAction(null, fd);
    setIsSubmitting(false);

    if (res?.success) {
      setCreatedResult({
        student: res.createdStudent,
        rawPassword: res.rawPassword,
      });
    } else {
      setError(res?.error || "Failed to create student account.");
    }
  };

  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://rd-classes.in";

  const credentialsSummary = createdResult
    ? `Hello ${createdResult.student.name}, your RD Classes login ID: ${createdResult.student.loginId}, password: ${createdResult.rawPassword}. Login: ${siteUrl}/student/login`
    : "";

  const handleCopy = () => {
    if (!credentialsSummary) return;
    navigator.clipboard.writeText(credentialsSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const cleanPhone = (phone || "").replace(/[^\d]/g, "");
  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
    credentialsSummary
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#141418] border border-[#2A2A33] rounded-2xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {createdResult ? (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <Check className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              Student Account Created!
            </h3>
            <p className="text-xs text-amber-400 font-semibold mb-4">
              Credentials shown once below. Please copy or send to the student immediately.
            </p>

            <div className="bg-[#18181F] border border-[#2A2A33] rounded-xl p-4 mb-5 text-xs">
              <pre className="text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
                {credentialsSummary}
              </pre>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 px-4 bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0B] text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Credentials"}</span>
              </button>

              {cleanPhone && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send on WhatsApp</span>
                </a>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#222228] text-right">
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-[#1E1E26] rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#FFB800]" />
              <span>Register New Student</span>
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Create student credentials and configure their single-device allowance.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vardaan Agarwal"
                    className="w-full bg-[#1A1A1E] border border-[#2D2D35] focus:border-[#FFB800] rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9811234567"
                    className="w-full bg-[#1A1A1E] border border-[#2D2D35] focus:border-[#FFB800] rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-gray-300">
                      Login ID *
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value.toLowerCase())}
                    className="w-full bg-[#1A1A1E] border border-[#2D2D35] focus:border-[#FFB800] rounded-xl px-3.5 py-2 text-xs font-mono text-white outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-gray-300">
                      Password (min 8 chars) *
                    </label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-[11px] text-[#FFB800] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Type or click Generate"
                    className="w-full bg-[#1A1A1E] border border-[#2D2D35] focus:border-[#FFB800] rounded-xl px-3.5 py-2 text-xs font-mono text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Device Limit (Default: 1)
                  </label>
                  <select
                    value={deviceLimit}
                    onChange={(e) => setDeviceLimit(Number(e.target.value))}
                    className="w-full bg-[#1A1A1E] border border-[#2D2D35] rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value={1}>1 Device (Strict Lock - Recommended)</option>
                    <option value={2}>2 Devices (e.g. Phone + Laptop)</option>
                    <option value={3}>3 Devices (Maximum Allowance)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={mustChangePassword}
                      onChange={(e) => setMustChangePassword(e.target.checked)}
                      className="accent-[#FFB800] rounded"
                    />
                    <span>Force password change on first login</span>
                  </label>
                </div>
              </div>

              {availableCourses.length > 0 && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Enroll in Courses:
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-[#17171C] rounded-xl border border-[#26262E]">
                    {availableCourses.map((c) => (
                      <label
                        key={c._id}
                        className="flex items-center gap-2 text-xs text-gray-300 hover:text-white p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(c._id)}
                          onChange={() => handleCourseToggle(c._id)}
                          className="accent-[#FFB800]"
                        />
                        <span>{c.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[#222228]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-[#202028] rounded-xl border border-[#30303A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0B] text-xs font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Student...</span>
                    </>
                  ) : (
                    <span>Create & Show Credentials</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
