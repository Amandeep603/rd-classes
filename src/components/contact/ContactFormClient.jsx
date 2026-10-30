"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, AlertCircle, ChevronDown, Loader2 } from "lucide-react";

const SUBJECT_OPTIONS = [
  "Course Enquiry",
  "Admissions",
  "Fees & Batches",
  "Results",
  "Other",
];

export default function ContactFormClient() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
    website: "", // Honeypot
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const validate = () => {
    const errs = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = "Please enter your full name";
    }

    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errs.phone = "Please enter a valid 10-digit Indian mobile number";
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = "Please enter a valid email address";
    }

    if (!formData.subject || formData.subject.trim() === "") {
      errs.subject = "Please select a subject";
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errs.message = "Message must be at least 10 characters";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          website: formData.website, // Honeypot
          source: "Contact page",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message. Please try again.");
      }

      setSuccessMessage(data.message || "Thank you! We'll get back to you shortly.");
      setFormData({
        name: "",
        phone: "",
        email: "",
        subject: "",
        message: "",
        website: "",
      });
      setErrors({});
    } catch (err) {
      setErrorMessage(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-9 shadow-[0_10px_35px_rgba(0,0,0,0.05)] border border-[#ECEFF3] relative transition-shadow hover:shadow-[0_16px_45px_rgba(0,0,0,0.08)]">
      {/* Card Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-[26px] font-bold text-[#0B1B3D] tracking-tight">
          Send us a Message
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Fill in the details and our team will get back to you shortly.
        </p>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-start gap-3 animate-in fade-in duration-200"
        >
          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-[#065F46]">Message Sent Successfully</h4>
            <p className="text-xs sm:text-sm text-[#047857] mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-3 animate-in fade-in duration-200"
        >
          <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-[#991B1B]">Unable to Send Message</h4>
            <p className="text-xs sm:text-sm text-[#B91C1C] mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
        {/* Honeypot field (hidden from view) */}
        <div className="sr-only hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            type="text"
            name="website"
            value={formData.website}
            onChange={(e) => handleChange("website", e.target.value)}
            tabIndex="-1"
            autoComplete="off"
          />
        </div>

        {/* Row 1: Full Name & Phone Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Full Name */}
          <div>
            <label
              htmlFor="contact-name"
              className="block text-xs font-semibold text-[#1E293B] mb-1.5"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              name="name"
              required
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`w-full rounded-xl border px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all focus:outline-none focus:ring-2 ${
                errors.name
                  ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200"
                  : "border-[#E2E8F0] bg-white focus:border-[#FFB800] focus:ring-[#FFB800]/20"
              }`}
            />
            {errors.name && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.name}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label
              htmlFor="contact-phone"
              className="block text-xs font-semibold text-[#1E293B] mb-1.5"
            >
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              id="contact-phone"
              type="tel"
              name="phone"
              required
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className={`w-full rounded-xl border px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all focus:outline-none focus:ring-2 ${
                errors.phone
                  ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200"
                  : "border-[#E2E8F0] bg-white focus:border-[#FFB800] focus:ring-[#FFB800]/20"
              }`}
            />
            {errors.phone && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* Row 2: Email Address & Subject */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Email Address */}
          <div>
            <label
              htmlFor="contact-email"
              className="block text-xs font-semibold text-[#1E293B] mb-1.5"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              name="email"
              required
              placeholder="Enter your email address"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={`w-full rounded-xl border px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all focus:outline-none focus:ring-2 ${
                errors.email
                  ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200"
                  : "border-[#E2E8F0] bg-white focus:border-[#FFB800] focus:ring-[#FFB800]/20"
              }`}
            />
            {errors.email && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.email}</p>
            )}
          </div>

          {/* Subject Dropdown */}
          <div>
            <label
              htmlFor="contact-subject"
              className="block text-xs font-semibold text-[#1E293B] mb-1.5"
            >
              Subject <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="contact-subject"
                name="subject"
                required
                value={formData.subject}
                onChange={(e) => handleChange("subject", e.target.value)}
                className={`w-full appearance-none rounded-xl border px-4 py-3 pr-10 text-sm transition-all focus:outline-none focus:ring-2 cursor-pointer ${
                  formData.subject ? "text-[#0F172A]" : "text-[#94A3B8]"
                } ${
                  errors.subject
                    ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200"
                    : "border-[#E2E8F0] bg-white focus:border-[#FFB800] focus:ring-[#FFB800]/20"
                }`}
              >
                <option value="" disabled className="text-gray-400">
                  Select a subject
                </option>
                {SUBJECT_OPTIONS.map((sub) => (
                  <option key={sub} value={sub} className="text-[#0F172A]">
                    {sub}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#64748B] pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
            {errors.subject && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.subject}</p>
            )}
          </div>
        </div>

        {/* Row 3: Message */}
        <div>
          <label
            htmlFor="contact-message"
            className="block text-xs font-semibold text-[#1E293B] mb-1.5"
          >
            Your Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={4}
            placeholder="Type your message here..."
            value={formData.message}
            onChange={(e) => handleChange("message", e.target.value)}
            className={`w-full rounded-xl border px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all focus:outline-none focus:ring-2 resize-none ${
              errors.message
                ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-200"
                : "border-[#E2E8F0] bg-white focus:border-[#FFB800] focus:ring-[#FFB800]/20"
            }`}
          />
          {errors.message && (
            <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base text-[#0B1B3D] bg-[#FFB800] hover:bg-[#F59E0B] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-150 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#0B1B3D]" />
                <span>Sending Message...</span>
              </>
            ) : (
              <>
                <span>Send Message</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

