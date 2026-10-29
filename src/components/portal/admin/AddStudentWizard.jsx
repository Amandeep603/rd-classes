"use client";

import { useState, useEffect } from "react";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";
import CopyButton from "../ui/CopyButton";
import {
  User,
  Phone,
  BookOpen,
  Key,
  Shield,
  CheckCircle2,
  Calendar,
  Sparkles,
  MessageCircle,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Mail,
  Send,
} from "lucide-react";
import {
  createStudentWizardAction,
  sendCredentialsEmailAction,
  checkEmailConfigAction,
} from "@/server/actions/admin.students.actions.js";

function generatePassword() {
  const chars = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
  let pwd = "";
  for (let i = 0; i < 10; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export default function AddStudentWizard({
  isOpen,
  onClose,
  courses = [],
  initialValues = null,
}) {
  const [step, setStep] = useState(1); // 1, 2, 3, or 4 (success)
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Details
  const [name, setName] = useState(initialValues?.name || "");
  const [phone, setPhone] = useState(initialValues?.phone || "");
  const [email, setEmail] = useState("");
  const [className, setClassName] = useState("12");
  const [school, setSchool] = useState("");

  // Step 2: Courses & Payment
  const currentYear = new Date().getFullYear();
  const defaultExpiryStr = `${currentYear + 1}-03-31`;
  const [selectedCourses, setSelectedCourses] = useState(
    initialValues?.courseId ? [initialValues.courseId] : []
  );
  const [courseExpiry, setCourseExpiry] = useState({});
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [paymentRemark, setPaymentRemark] = useState("");

  // Sync initialValues during render when prop changes
  const [prevInitialValues, setPrevInitialValues] = useState(initialValues);
  if (initialValues !== prevInitialValues) {
    setPrevInitialValues(initialValues);
    if (initialValues?.name) setName(initialValues.name);
    if (initialValues?.phone) setPhone(initialValues.phone);
    if (initialValues?.courseId) setSelectedCourses([initialValues.courseId]);
  }

  // Step 3: Credentials
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState(generatePassword());
  const [deviceLimit, setDeviceLimit] = useState(1);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Result state
  const [resultData, setResultData] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");

  const resetForm = () => {
    setStep(1);
    setName("");
    setPhone("");
    setEmail("");
    setClassName("12");
    setSchool("");
    setSelectedCourses([]);
    setCourseExpiry({});
    setPaymentAmount("");
    setPaymentRemark("");
    setLoginId("");
    setPassword(generatePassword());
    setDeviceLimit(1);
    setMustChangePassword(false);
    setError("");
    setResultData(null);
    setSendingEmail(false);
    setEmailMessage("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleCourse = (cId) => {
    if (selectedCourses.includes(cId)) {
      setSelectedCourses(selectedCourses.filter((id) => id !== cId));
    } else {
      setSelectedCourses([...selectedCourses, cId]);
      if (!courseExpiry[cId]) {
        setCourseExpiry({ ...courseExpiry, [cId]: defaultExpiryStr });
      }
    }
  };

  const handleNextFromStep1 = () => {
    if (!name.trim()) {
      setError("Please enter the student's full name.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    setError("");
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!password) {
      setError("Please set a password.");
      return;
    }
    setSubmitting(true);
    setError("");

    const courseAssignments = selectedCourses.map((cId) => ({
      courseId: cId,
      expiresAt: courseExpiry[cId] || defaultExpiryStr,
      paymentNote: paymentAmount
        ? {
            amount: Number(paymentAmount) || 0,
            mode: paymentMode,
            remark: paymentRemark,
          }
        : undefined,
    }));

    try {
      const res = await createStudentWizardAction({
        name,
        phone,
        email: email.trim(),
        className,
        school,
        loginId: loginId || undefined,
        password,
        deviceLimit,
        mustChangePassword,
        courseAssignments,
      });

      if (res.success) {
        setResultData(res);
        setStep(4); // Success step
      } else {
        setError(res.error || "Failed to create student.");
      }
    } catch (err) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappPhone = phone ? phone.replace(/\D/g, "") : "";
  const whatsappUrl = resultData
    ? `https://wa.me/${whatsappPhone || ""}?text=${encodeURIComponent(
        resultData.whatsappMessage
      )}`
    : "#";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 4 ? "Student Enrolled Successfully!" : "Add New Student"}
      description={
        step === 4
          ? "Share the credentials with the student via WhatsApp."
          : `Step ${step} of 3 — ${
              step === 1
                ? "Personal Information"
                : step === 2
                ? "Course Enrolment & Payment"
                : "Credentials & Device Setup"
            }`
      }
      maxWidth="max-w-2xl"
    >
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200"
        >
          {error}
        </div>
      )}

      {/* Step Indicator */}
      {step < 4 && (
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? "bg-[#FFC21A]" : "bg-neutral-200"
              }`}
            />
          ))}
        </div>
      )}

      {/* STEP 1: Personal Details */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tanvi Agarwal"
                className="w-full rounded-xl border border-black/10 py-2.5 pl-10 pr-4 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-1">
                WhatsApp Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl border border-black/10 py-2.5 pl-10 pr-4 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-1">
                Class
              </label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full rounded-xl border border-black/10 py-2.5 px-3 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20 bg-white"
              >
                <option value="12">Class 12 (Board Prep)</option>
                <option value="11">Class 11 (Foundation)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-1">
              Email Address (Optional)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. student@gmail.com"
                className="w-full rounded-xl border border-black/10 py-2.5 pl-10 pr-4 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-1">
              School Name (Optional)
            </label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="e.g. Apeejay School, Faridabad"
              className="w-full rounded-xl border border-black/10 py-2.5 px-3 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="yellow" onClick={handleNextFromStep1}>
              <span>Next: Course Enrolment</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Course Assignment & Payment Note */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-2">
              Select Enrolled Courses
            </label>
            {courses.length > 0 ? (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {courses.map((c) => {
                  const isChecked = selectedCourses.includes(c._id);
                  return (
                    <div
                      key={c._id}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-amber-50/60 border-amber-300"
                          : "bg-white border-black/8 hover:bg-neutral-50"
                      }`}
                      onClick={() => toggleCourse(c._id)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div
                          className="h-4 w-4 rounded text-amber-500 focus:ring-amber-400"
                        />
                        <span className="text-sm font-bold text-[#111827]">
                          {c.title}
                        </span>
                      </div>

                      {isChecked && (
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-xs text-[#6B7280]">Expires:</span>
                          <input
                            type="date"
                            value={courseExpiry[c._id] || defaultExpiryStr}
                            onChange={(e) =>
                              setCourseExpiry({
                                ...courseExpiry,
                                [c._id]: e.target.value,
                              })
                            }
                            className="rounded-lg border border-black/10 px-2 py-1 text-xs text-[#111827] bg-white"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#6B7280]">No published courses found.</p>
            )}
          </div>

          {/* Optional Private Payment Note */}
          <div className="rounded-2xl bg-neutral-50 p-4 border border-black/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#374151]">
                Payment Note (Admin Only)
              </span>
              <span className="text-[11px] text-[#9CA3AF]">
                Never visible to student
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full rounded-xl border border-black/10 py-1.5 px-3 text-sm text-[#111827] bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full rounded-xl border border-black/10 py-1.5 px-3 text-sm text-[#111827] bg-white"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={paymentRemark}
                onChange={(e) => setPaymentRemark(e.target.value)}
                placeholder="Optional remark: Paid in 2 installments / Receipt #104"
                className="w-full rounded-xl border border-black/10 py-1.5 px-3 text-xs text-[#111827] bg-white"
              />
            </div>
          </div>

          <div className="flex justify-between gap-3 pt-4">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back</span>
            </Button>
            <Button variant="yellow" onClick={handleNextFromStep2}>
              <span>Next: Credentials Setup</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Credentials & Device Limit */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-1">
              Login ID
            </label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="Leave blank to auto-generate from Student Code"
              className="w-full rounded-xl border border-black/10 py-2.5 px-3 text-sm text-[#111827] focus:border-[#FFC21A] focus:outline-none focus:ring-2 focus:ring-[#FFC21A]/20"
            />
            <p className="mt-1 text-[11px] text-[#6B7280]">
              If left blank, it will automatically use the student code lowercase without dashes (e.g. rd2025001).
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#374151]">
                Temporary Password <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setPassword(generatePassword())}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Regenerate</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-black/10 py-2.5 px-3 text-sm font-mono font-bold text-[#111827] bg-neutral-50"
              />
              <CopyButton text={password} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-1">
                Approved Device Limit
              </label>
              <select
                value={deviceLimit}
                onChange={(e) => setDeviceLimit(Number(e.target.value))}
                className="w-full rounded-xl border border-black/10 py-2 px-3 text-sm text-[#111827] bg-white"
              >
                <option value={1}>1 Device (Recommended Default)</option>
                <option value={2}>2 Devices</option>
                <option value={3}>3 Devices (Maximum)</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mustChangePassword}
                  onChange={(e) => setMustChangePassword(e.target.checked)}
                  className="h-4 w-4 rounded text-amber-500 focus:ring-amber-400"
                />
                <span className="text-xs font-semibold text-[#374151]">
                  Force password change on 1st login
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-between gap-3 pt-6 border-t border-black/5">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back</span>
            </Button>
            <Button
              variant="yellow"
              onClick={handleSubmit}
              loading={submitting}
            >
              <span>Create Student Account</span>
              <Sparkles className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Success Screen */}
      {step === 4 && resultData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200/80 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-amber-900 border-b border-amber-200 pb-2">
              <span>Account Credentials Created</span>
              <span className="text-[11px] text-amber-800">Shown Once Only</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#6B7280] block text-[11px]">Student</span>
                <span className="font-bold text-[#111827]">
                  {resultData.student.name}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Class</span>
                <span className="font-bold text-[#111827]">
                  Class {resultData.student.className}
                </span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Login ID</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-[#111827]">
                    {resultData.student.loginId}
                  </span>
                  <CopyButton text={resultData.student.loginId} size="sm" />
                </div>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px]">Password</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-[#111827]">
                    {resultData.rawPassword}
                  </span>
                  <CopyButton text={resultData.rawPassword} size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Prefilled WhatsApp Message Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#374151]">
                Prefilled WhatsApp Onboarding Message
              </span>
              <CopyButton text={resultData.whatsappMessage} label="Copy Message" size="sm" />
            </div>
            <div className="rounded-2xl bg-neutral-50 p-3.5 border border-black/8 text-xs text-[#374151] leading-relaxed font-mono">
              {resultData.whatsappMessage}
            </div>
          </div>

          {/* WhatsApp & Email Actions */}
          <div className="space-y-3 pt-2">
            {emailMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  emailMessage.startsWith("✓")
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                {emailMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 px-4 font-bold text-white shadow-md hover:bg-emerald-700 transition-colors text-xs sm:text-sm min-h-[44px]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp Credentials</span>
              </a>

              <button
                type="button"
                disabled={sendingEmail}
                onClick={async () => {
                  setSendingEmail(true);
                  setEmailMessage("");
                  try {
                    const status = await checkEmailConfigAction();
                    if (!status.isConfigured) {
                      setEmailMessage("Email is not configured in this environment.");
                      return;
                    }
                    if (!resultData?.student?.email) {
                      setEmailMessage("No email address provided for this student.");
                      return;
                    }
                    const res = await sendCredentialsEmailAction(
                      resultData.student._id,
                      { password: resultData.rawPassword }
                    );
                    if (res?.success) {
                      setEmailMessage(`✓ Credentials successfully emailed to ${resultData.student.email}`);
                    } else {
                      setEmailMessage(res?.error || "Failed to deliver email.");
                    }
                  } catch (err) {
                    setEmailMessage(err?.message || "Error sending email.");
                  } finally {
                    setSendingEmail(false);
                  }
                }}
                className="flex w-full flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0B2545] py-3.5 px-4 font-bold text-white shadow-md hover:bg-[#143565] transition-colors text-xs sm:text-sm min-h-[44px] cursor-pointer disabled:opacity-60"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending Mail...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 text-[#FFC21A]" />
                    <span>Email Credentials</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                Done & Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
