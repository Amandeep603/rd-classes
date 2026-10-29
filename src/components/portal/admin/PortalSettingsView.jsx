"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Settings,
  Building,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Share2,
  Smartphone,
  Lock,
  LogOut,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Clock,
  Compass,
  Upload,
} from "lucide-react";
import PageHeader from "@/components/admin/ui/PageHeader";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import FormField from "@/components/admin/ui/FormField";
import { useToast } from "@/components/admin/ui/Toast";

export default function PortalSettingsView({ initialSettings = {}, admin = {} }) {
  const { showToast } = useToast();

  // General Settings State
  const [instituteName, setInstituteName] = useState(
    initialSettings.instituteName || "RD Classes"
  );
  const [tagline, setTagline] = useState(
    initialSettings.tagline || "Faridabad's Premier Accountancy Institute for CBSE Class 11 & 12"
  );
  const [ownerName, setOwnerName] = useState(
    initialSettings.ownerName || "Ronak Dugar"
  );
  const [phone, setPhone] = useState(initialSettings.phone || "+91 83685 45620");
  const [whatsapp, setWhatsapp] = useState(
    initialSettings.whatsapp || initialSettings.whatsappNumber || "918368545620"
  );
  const [whatsappDefaultMessage, setWhatsappDefaultMessage] = useState(
    initialSettings.whatsappDefaultMessage ||
      "Hi Sir, I am interested in {course}. Can you please share the syllabus and demo lecture access?{studentLine}"
  );
  const [email, setEmail] = useState(initialSettings.email || "contact@rdclasses.com");
  const [address, setAddress] = useState(
    initialSettings.address || "SCF 59-60, 2nd Floor, Sector 9, Faridabad, Haryana 121006"
  );
  const [city, setCity] = useState(initialSettings.city || "Faridabad");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(
    initialSettings.googleMapsUrl || "https://maps.google.com/?q=RD+Classes+Sector+9+Faridabad"
  );
  const [workingHours, setWorkingHours] = useState(
    initialSettings.workingHours || "Mon - Sat: 9:00 AM - 7:30 PM"
  );

  // Social Links
  const [instagram, setInstagram] = useState(
    initialSettings.socialLinks?.instagram || "https://instagram.com"
  );
  const [youtube, setYoutube] = useState(
    initialSettings.socialLinks?.youtube || "https://youtube.com"
  );
  const [facebook, setFacebook] = useState(
    initialSettings.socialLinks?.facebook || "https://facebook.com"
  );
  const [telegram, setTelegram] = useState(
    initialSettings.socialLinks?.telegram || "https://telegram.org"
  );

  // Logo & Device Restriction
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl || "");
  const [defaultMaxDevices, setDefaultMaxDevices] = useState(
    initialSettings.defaultMaxDevices || 1
  );
  const [deviceLockMode, setDeviceLockMode] = useState(
    initialSettings.deviceLockMode || "relaxed"
  );

  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const logoInputRef = useRef(null);

  // Logout All Students State
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOutStudents, setLoggingOutStudents] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/profile/upload-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload logo");

      setLogoUrl(data.url);
      showToast("Logo uploaded successfully", "success");
    } catch (err) {
      showToast(err.message || "Logo upload failed", "error");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsError("");

    try {
      const payload = {
        instituteName: instituteName.trim(),
        tagline: tagline.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        whatsappDefaultMessage: whatsappDefaultMessage.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        googleMapsUrl: googleMapsUrl.trim(),
        workingHours: workingHours.trim(),
        logoUrl: logoUrl.trim(),
        socialLinks: {
          instagram: instagram.trim(),
          youtube: youtube.trim(),
          facebook: facebook.trim(),
          telegram: telegram.trim(),
        },
        defaultMaxDevices: Number(defaultMaxDevices),
        deviceLockMode,
      };

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      showToast("Institute settings saved and public cache revalidated!", "success");
    } catch (err) {
      setSettingsError(err.message);
      showToast(err.message, "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogoutAllStudents = async () => {
    setLoggingOutStudents(true);
    try {
      const res = await fetch("/api/admin/settings/logout-all-students", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      showToast(data.message || "All student sessions revoked", "success");
      setShowLogoutConfirm(false);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoggingOutStudents(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      <PageHeader
        title="Institute Settings"
        subtitle="Manage public institute details, owner information, contact routing, and session controls."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Settings" },
        ]}
      />

      <div className="space-y-8">
        {/* 1. General Institute Profile */}
        <div className="rounded-[22px] border border-black/8 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 pb-5 border-b border-black/6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">Institute Profile & Details</h2>
              <p className="text-xs text-[#6B7280]">
                Values dynamically loaded by the public website header, footer, and enquiry buttons.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5 pt-6">
            {settingsError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{settingsError}</span>
              </div>
            )}

            {/* Logo Upload Row */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
              <div className="relative group">
                {logoUrl ? (
                  <div className="relative h-20 w-36 overflow-hidden rounded-xl border border-black/10 bg-slate-50 p-2 shadow-2xs">
                    <Image
                      src={logoUrl}
                      alt="Institute Logo"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-36 items-center justify-center rounded-xl border-2 border-dashed border-black/15 bg-black/2 text-xs font-bold text-slate-500">
                    No Custom Logo
                  </div>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 text-white backdrop-blur-2xs">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-center sm:text-left">
                <div className="text-sm font-bold text-[#111827]">Institute Logo</div>
                <p className="text-xs text-[#6B7280]">
                  Appears in header, footer, and emails. Recommended format: PNG or WebP with transparent background.
                </p>
                <div className="flex items-center gap-3 pt-1 justify-center sm:justify-start">
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-1.5 text-xs font-bold text-[#111827] shadow-2xs hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5 text-slate-600" />
                    <span>{logoUrl ? "Change Logo" : "Upload Logo"}</span>
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="Institute Name" required helper="Displayed on banners and branding.">
                <input
                  type="text"
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  placeholder="RD Classes"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                />
              </FormField>

              <FormField label="Owner / Lead Faculty" required helper="Founder and head educator.">
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Ronak Dugar"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                />
              </FormField>
            </div>

            <FormField label="Tagline / Motto" helper="Appears under brand name on website and public materials.">
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Faridabad's Premier Accountancy Institute for CBSE Class 11 & 12"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="Phone Number" required helper="Primary public call contact.">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 83685 45620"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                />
              </FormField>

              <FormField
                label="WhatsApp Number"
                required
                helper="Format: 919876543210 (digits with country code, no + or spaces)"
              >
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="919876543210"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                />
              </FormField>
            </div>

            <FormField
              label="WhatsApp Default Message Template"
              helper="Template used for new enquiry chats. Placeholders: {course}, {name}, {loginId}, {link}, {studentLine}"
            >
              <textarea
                rows={3}
                value={whatsappDefaultMessage}
                onChange={(e) => setWhatsappDefaultMessage(e.target.value)}
                placeholder="Hi Sir, I am interested in {course}. Can you please share the syllabus and demo lecture access?{studentLine}"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-mono text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="Contact Email" required helper="Public admissions and support email.">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@rdclasses.com"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                />
              </FormField>

              <FormField label="City / Region" required helper="City name for local search and footers.">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Faridabad"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                />
              </FormField>
            </div>

            <FormField label="Physical Center Address" required helper="Full street address displayed in the footer.">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="SCF 59-60, 2nd Floor, Sector 9, Faridabad, Haryana 121006"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="Google Maps Directions URL" helper="Link opened by 'Google Maps Directions' in the footer.">
                <input
                  type="url"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/?q=RD+Classes+Sector+9+Faridabad"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                />
              </FormField>

              <FormField label="Working Hours" helper="Office hours shown on contact details.">
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder="Mon - Sat: 9:00 AM - 7:30 PM"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                />
              </FormField>
            </div>

            {/* Social Media Links */}
            <div className="pt-4 border-t border-black/6">
              <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider mb-4">
                Social Media Links (Instagram, YouTube, Facebook, Telegram)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField label="Instagram URL">
                  <input
                    type="url"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="https://instagram.com/rdclasses"
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                  />
                </FormField>
                <FormField label="YouTube URL">
                  <input
                    type="url"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    placeholder="https://youtube.com/@rdclasses"
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                  />
                </FormField>
                <FormField label="Facebook URL">
                  <input
                    type="url"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="https://facebook.com/rdclasses"
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                  />
                </FormField>
                <FormField label="Telegram URL">
                  <input
                    type="url"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="https://t.me/rdclasses"
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                  />
                </FormField>
              </div>
            </div>

            {/* Security & Device Restriction Defaults */}
            <div className="pt-4 border-t border-black/6">
              <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider mb-4">
                Student Device Policy Default
              </h3>
              <div className="max-w-xs">
                <FormField
                  label="Default Max Devices Per Student"
                  helper="Newly added students automatically receive this device limit (default 1)."
                  required
                >
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={defaultMaxDevices}
                    onChange={(e) => setDefaultMaxDevices(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                  />
                </FormField>

                <FormField
                  label="Device Lock Mode"
                  helper="Relaxed matches by device type & OS; Strict binds to a persistent cookie token."
                >
                  <select
                    value={deviceLockMode}
                    onChange={(e) => setDeviceLockMode(e.target.value)}
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                  >
                    <option value="relaxed">Relaxed (Default: Device type + OS)</option>
                    <option value="strict">Strict (Cookie Token Bound)</option>
                  </select>
                </FormField>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 rounded-xl bg-[#FFB800] px-6 py-2.5 text-sm font-extrabold text-[#111827] shadow-xs hover:bg-[#F0AD00] transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {savingSettings ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Institute Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 2. Emergency Session Control: Log out all students */}
        <div className="rounded-[22px] border border-red-200 bg-red-50/50 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 border border-red-200">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-red-950">Emergency Student Session Control</h3>
                <p className="text-xs text-red-800 leading-relaxed max-w-xl">
                  Immediately revokes all active session tokens for every enrolled student across all browsers and devices. Students will be required to log in again with their loginId and password. Admin sessions remain completely unaffected.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition-all cursor-pointer shrink-0 active:scale-98"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out All Students</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Logging Out All Students */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogoutAllStudents}
        title="Revoke All Student Sessions?"
        message="This will instantly log out every student across all active mobile and desktop devices. They will need to re-enter their credentials to access lectures and notes."
        confirmText="Yes, Log Out All Students"
        isDestructive
        isLoading={loggingOutStudents}
      />
    </div>
  );
}
