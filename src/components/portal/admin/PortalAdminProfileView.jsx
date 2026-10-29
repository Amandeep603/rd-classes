"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  User,
  Mail,
  Phone,
  Camera,
  Lock,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import PageHeader from "@/components/admin/ui/PageHeader";
import FormField from "@/components/admin/ui/FormField";
import { useToast } from "@/components/admin/ui/Toast";

// Helper: compress image file to square WebP under 200KB on canvas
async function processAdminImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const startX = (img.width - side) / 2;
        const startY = (img.height - side) / 2;

        const targetSize = Math.min(side, 500); // 500x500 square
        const canvas = document.createElement("canvas");
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, startX, startY, side, side, 0, 0, targetSize, targetSize);

        let quality = 0.85;
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Image processing failed"));
            }
            resolve(blob);
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function PortalAdminProfileView({ initialUser = {} }) {
  const { showToast } = useToast();

  // Profile Details State
  const [name, setName] = useState(initialUser.name || "Ronak Dugar");
  const [email, setEmail] = useState(initialUser.email || "");
  const [phone, setPhone] = useState(initialUser.phone || "");
  const [photoUrl, setPhotoUrl] = useState(initialUser.photoUrl || initialUser.avatarUrl || "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const fileInputRef = useRef(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("image") && !file.name.match(/\.(png|webp|jpg|jpeg)$/i)) {
      showToast("Please select a valid image file (PNG, JPG, or WebP).", "error");
      return;
    }

    setUploadingPhoto(true);
    try {
      const processedBlob = await processAdminImage(file);
      const formData = new FormData();
      formData.append("file", processedBlob, "admin-photo.webp");

      const res = await fetch("/api/admin/profile/upload-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload photo");

      setPhotoUrl(data.url);
      showToast("Profile photo uploaded to Cloudinary successfully", "success");
    } catch (err) {
      showToast(err.message || "Photo upload failed", "error");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError("");

    if (!name.trim()) {
      setProfileError("Full Name is required.");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          photoUrl: photoUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      showToast("Profile updated successfully", "success");
    } catch (err) {
      setProfileError(err.message);
      showToast(err.message, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/admin/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");

      showToast(data.message || "Password changed successfully. Other sessions logged out.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message);
      showToast(err.message, "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const initial = name ? name.charAt(0).toUpperCase() : "R";

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      <PageHeader
        title="Admin Profile"
        subtitle="Manage your personal details, profile picture, and administrator credentials."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Profile" },
        ]}
      />

      {/* 1. Profile Details Card */}
      <div className="rounded-[22px] border border-black/8 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 border-b border-black/6 pb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Personal Details</h2>
            <p className="text-xs text-[#6B7280]">
              Your public identity and contact information for administration.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="mt-6 space-y-6">
          {profileError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {/* Profile Photo Row */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
            <div className="relative group">
              {photoUrl ? (
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl ring-4 ring-[#FFC21A] shadow-md">
                  <Image
                    src={photoUrl}
                    alt={name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFD54A] to-[#FFC21A] text-2xl font-black text-neutral-900 shadow-md ring-4 ring-[#FFC21A]">
                  {initial}
                </div>
              )}

              {uploadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-white backdrop-blur-2xs">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-center sm:text-left">
              <div className="text-sm font-bold text-[#111827]">Profile Photo</div>
              <p className="text-xs text-[#6B7280]">
                Auto-cropped to square and compressed to WebP under 200KB before Cloudinary upload.
              </p>
              <div className="flex items-center gap-3 pt-1 justify-center sm:justify-start">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-1.5 text-xs font-bold text-[#111827] shadow-2xs hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5 text-slate-600" />
                  <span>{photoUrl ? "Change Photo" : "Upload Photo"}</span>
                </button>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl("")}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              label="Full Name"
              required
              helper="Appears on the dashboard welcome banner and sidebar profile."
            >
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ronak Dugar"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
              />
            </FormField>

            <FormField
              label="Email Address"
              helper="Used for system alerts and communication."
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ronak@rdclasses.com"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
              />
            </FormField>

            <FormField
              label="Phone Number"
              helper="Primary contact number for administrator."
            >
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 83685 45620"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
              />
            </FormField>

            <FormField
              label="Login ID"
              helper="Assigned admin username (cannot be modified)."
            >
              <input
                type="text"
                disabled
                value={initialUser.loginId || "admin"}
                className="w-full rounded-xl border border-black/10 bg-black/4 px-4 py-2.5 text-sm font-medium text-[#6B7280] cursor-not-allowed"
              />
            </FormField>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FFB800] px-6 py-2.5 text-sm font-extrabold text-[#111827] shadow-xs hover:bg-[#F0AD00] transition-all cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Change Password Card */}
      <div className="rounded-[22px] border border-black/8 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 border-b border-black/6 pb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Change Password</h2>
            <p className="text-xs text-[#6B7280]">
              Must be at least 8 characters. Changing your password logs out all other admin sessions.
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="mt-6 space-y-6">
          {passwordError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <FormField label="Current Password" required>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
              />
            </FormField>

            <FormField label="New Password" required helper="Minimum 8 characters">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
              />
            </FormField>

            <FormField label="Confirm Password" required helper="Re-enter new password">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111827] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
              />
            </FormField>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-neutral-800 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
