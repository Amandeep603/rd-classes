"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Filter,
  MoreVertical,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
  Edit,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  BookOpen,
  Eye,
  LogOut,
  RefreshCw,
  Laptop,
  Tablet,
  Unlock,
} from "lucide-react";
import PageHeader from "@/components/admin/ui/PageHeader";
import DataTable from "@/components/admin/ui/DataTable";
import Modal from "@/components/admin/ui/Modal";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import StatusBadge from "@/components/admin/ui/StatusBadge";
import FormField from "@/components/admin/ui/FormField";

export default function StudentsManagementView({
  initialStudents = [],
  initialTotal = 0,
  initialPage = 1,
  initialTotalPages = 1,
  availableCourses = [],
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Filters state
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [deviceFilter, setDeviceFilter] = useState(searchParams.get("device") || "");
  const [courseFilter, setCourseFilter] = useState(searchParams.get("course") || "");
  const [page, setPage] = useState(initialPage);

  // Data state
  const [students, setStudents] = useState(initialStudents);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(searchParams.get("add") === "1");
  const [editStudent, setEditStudent] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [devicesDrawerStudent, setDevicesDrawerStudent] = useState(null);
  const [studentDevices, setStudentDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState(null);
  const [resetConfirmStudent, setResetConfirmStudent] = useState(null);

  // Single action feedback credentials modal (shown ONCE)
  const [credentialsModal, setCredentialsModal] = useState(null);

  // Add / Edit form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    loginId: "",
    maxDevices: 1,
    status: "active",
    courseIds: [],
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Import flow state
  const [importFile, setImportFile] = useState(null);
  const [importCourseId, setImportCourseId] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  // Copied state indicator
  const [copiedKey, setCopiedKey] = useState(null);

  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchStudents = useCallback(() => {
    setRefreshIndex((i) => i + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const q = new URLSearchParams();
        if (search.trim()) q.set("search", search.trim());
        if (statusFilter) q.set("status", statusFilter);
        if (deviceFilter) q.set("device", deviceFilter);
        if (courseFilter) q.set("course", courseFilter);
        q.set("page", String(page));

        const res = await fetch(`/api/admin/students?${q.toString()}`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [search, statusFilter, deviceFilter, courseFilter, page, refreshIndex]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const getWhatsAppTemplate = (cred) => {
    const site = typeof window !== "undefined" ? window.location.origin : "https://rd-classes.in";
    return `Hi ${cred.name}, your RD Classes login ID is ${cred.loginId} and password is ${cred.password}. Login at ${site}/student-login. Your account works on one approved device.`;
  };

  // Open Add Student Modal
  const handleOpenAdd = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      loginId: "",
      maxDevices: 1,
      status: "active",
      courseIds: [],
    });
    setFormError("");
    setAddModalOpen(true);
  };

  // Open Edit Student Modal
  const handleOpenEdit = (student) => {
    setEditStudent(student);
    setFormData({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      loginId: student.loginId || "",
      maxDevices: student.maxDevices || 1,
      status: student.status || "active",
      courseIds: (student.enrolledCourses || []).map((c) => c._id),
    });
    setFormError("");
  };

  // Submit Add Student
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create student");

      setAddModalOpen(false);
      setCredentialsModal({
        title: "Student Account Created",
        credentials: [data.credentials],
      });
      fetchStudents();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Student
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch(`/api/admin/students/${editStudent._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update student");

      setEditStudent(null);
      fetchStudents();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset Password Action
  const handleConfirmResetPassword = async () => {
    if (!resetConfirmStudent) return;
    try {
      const res = await fetch(`/api/admin/students/${resetConfirmStudent._id}/reset-password`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      const cred = data.credentials;
      setResetConfirmStudent(null);
      setCredentialsModal({
        title: "Password Reset Successfully",
        credentials: [cred],
      });
      fetchStudents();
    } catch (err) {
      alert(err.message);
    }
  };

  // Toggle Block / Unblock
  const handleToggleBlock = async (student) => {
    const newStatus = student.status === "active" ? "blocked" : "active";
    try {
      const res = await fetch(`/api/admin/students/${student._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchStudents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Student
  const handleConfirmDelete = async () => {
    if (!deleteConfirmStudent) return;
    try {
      const res = await fetch(`/api/admin/students/${deleteConfirmStudent._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteConfirmStudent(null);
        fetchStudents();
      }
    } catch (err) {
      alert("Failed to delete student: " + err.message);
    }
  };

  // Open Devices Drawer
  const handleOpenDevicesDrawer = async (student) => {
    setDevicesDrawerStudent(student);
    setDevicesLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${student._id}/devices`);
      if (res.ok) {
        const data = await res.json();
        setStudentDevices(data.devices || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDevicesLoading(false);
    }
  };

  // Revoke device from drawer
  const handleRevokeDevice = async (deviceId) => {
    if (!devicesDrawerStudent) return;
    try {
      const res = await fetch(`/api/admin/students/${devicesDrawerStudent._id}/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", deviceId }),
      });
      if (res.ok) {
        handleOpenDevicesDrawer(devicesDrawerStudent);
        fetchStudents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Logout everywhere from drawer
  const handleLogoutEverywhere = async () => {
    if (!devicesDrawerStudent) return;
    try {
      const res = await fetch(`/api/admin/students/${devicesDrawerStudent._id}/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout-all" }),
      });
      if (res.ok) {
        handleOpenDevicesDrawer(devicesDrawerStudent);
        fetchStudents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Unlock student login (clear rate limit locks)
  const handleUnlockLogin = async (student) => {
    try {
      const res = await fetch(`/api/admin/students/${student._id}/unlock-login`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || `Login unlocked for ${student.name}.`);
      } else {
        alert(data.error || "Failed to unlock login.");
      }
    } catch (e) {
      alert("Error unlocking login: " + e.message);
    }
  };

  // Import: Preview File
  const handleUploadFileForPreview = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setPreviewLoading(true);
    setPreviewData(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/admin/students/import/preview", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse file");
      setPreviewData(data);
    } catch (err) {
      alert("Preview error: " + err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Import: Confirm Import
  const handleConfirmImport = async () => {
    if (!previewData || previewData.validCount === 0) return;
    setImporting(true);

    const validRows = previewData.rows.filter((r) => r.valid);

    try {
      const res = await fetch("/api/admin/students/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validRows,
          courseId: importCourseId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import students");

      setImportResults(data.credentials || []);
      setPreviewData(null);
      fetchStudents();
    } catch (err) {
      alert("Import error: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Download Credentials CSV from results
  const downloadCredentialsCsv = (creds) => {
    const headers = ["Name", "Login ID", "Password", "Phone", "Email"];
    const rows = creds.map((c) => [
      `"${c.name}"`,
      `"${c.loginId}"`,
      `"${c.password}"`,
      `"${c.phone}"`,
      `"${c.email}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `rd_classes_credentials_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // DataTable columns definition
  const columns = [
    {
      header: "Student",
      field: "name",
      accessor: "name",
      render: (student) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0A192F] text-[#FFB800] font-bold flex items-center justify-center text-sm shrink-0">
            {student.name ? student.name.charAt(0).toUpperCase() : "S"}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{student.name}</div>
            <div className="text-xs text-slate-500 font-mono">{student.loginId}</div>
          </div>
        </div>
      ),
      cell: (student) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0A192F] text-[#FFB800] font-bold flex items-center justify-center text-sm shrink-0">
            {student.name ? student.name.charAt(0).toUpperCase() : "S"}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{student.name}</div>
            <div className="text-xs text-slate-500 font-mono">{student.loginId}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Contact",
      field: "phone",
      accessor: "phone",
      render: (student) => (
        <div className="text-sm">
          <div className="font-medium text-slate-800">{student.phone || "—"}</div>
          <div className="text-xs text-slate-500">{student.email || "No email"}</div>
        </div>
      ),
      cell: (student) => (
        <div className="text-sm">
          <div className="font-medium text-slate-800">{student.phone || "—"}</div>
          <div className="text-xs text-slate-500">{student.email || "No email"}</div>
        </div>
      ),
    },
    {
      header: "Courses",
      field: "enrolledCourses",
      accessor: "enrolledCourses",
      render: (student) => {
        const courses = student.enrolledCourses || [];
        if (courses.length === 0) {
          return <span className="text-xs text-slate-400 italic">No courses</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {courses.slice(0, 2).map((c) => (
              <span
                key={c._id || c.slug}
                className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 truncate max-w-[150px]"
              >
                {c.title}
              </span>
            ))}
            {courses.length > 2 && (
              <span className="text-[11px] text-slate-500 font-medium">
                +{courses.length - 2} more
              </span>
            )}
          </div>
        );
      },
      cell: (student) => {
        const courses = student.enrolledCourses || [];
        if (courses.length === 0) {
          return <span className="text-xs text-slate-400 italic">No courses</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {courses.slice(0, 2).map((c) => (
              <span
                key={c._id || c.slug}
                className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 truncate max-w-[150px]"
              >
                {c.title}
              </span>
            ))}
            {courses.length > 2 && (
              <span className="text-[11px] text-slate-500 font-medium">
                +{courses.length - 2} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "First Device",
      field: "firstDevice",
      accessor: "firstDevice",
      render: (student) => {
        const fd = student.firstDevice;
        if (!fd) {
          return <span className="text-xs text-slate-400 italic">None</span>;
        }
        const isMobile = fd.type === "mobile";
        const isTablet = fd.type === "tablet";
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-700">
            {isMobile ? (
              <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            ) : isTablet ? (
              <Tablet className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            ) : (
              <Laptop className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <span className="truncate max-w-[150px] font-medium" title={fd.label}>
              {fd.label}
            </span>
          </div>
        );
      },
      cell: (student) => {
        const fd = student.firstDevice;
        if (!fd) {
          return <span className="text-xs text-slate-400 italic">None</span>;
        }
        const isMobile = fd.type === "mobile";
        const isTablet = fd.type === "tablet";
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-700">
            {isMobile ? (
              <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            ) : isTablet ? (
              <Tablet className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            ) : (
              <Laptop className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <span className="truncate max-w-[150px] font-medium" title={fd.label}>
              {fd.label}
            </span>
          </div>
        );
      },
    },
    {
      header: "Last Login IP",
      field: "lastLoginIp",
      accessor: "lastLoginIp",
      render: (student) => (
        <span className="text-xs text-slate-600 font-mono">
          {student.lastLoginIp || "—"}
        </span>
      ),
      cell: (student) => (
        <span className="text-xs text-slate-600 font-mono">
          {student.lastLoginIp || "—"}
        </span>
      ),
    },
    {
      header: "Device Status",
      field: "deviceStatus",
      accessor: "deviceStatus",
      render: (student) => {
        if (student.deviceStatus === "pending") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Pending Request
            </span>
          );
        }
        if (student.deviceStatus === "approved") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              {student.approvedDeviceCount} Approved
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
            No Device
          </span>
        );
      },
      cell: (student) => {
        if (student.deviceStatus === "pending") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Pending Request
            </span>
          );
        }
        if (student.deviceStatus === "approved") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              {student.approvedDeviceCount} Approved
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
            No Device
          </span>
        );
      },
    },
    {
      header: "Last Login",
      field: "lastLoginAt",
      accessor: "lastLoginAt",
      render: (student) => (
        <span className="text-xs text-slate-500">
          {student.lastLoginAt
            ? new Date(student.lastLoginAt).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Never"}
        </span>
      ),
      cell: (student) => (
        <span className="text-xs text-slate-500">
          {student.lastLoginAt
            ? new Date(student.lastLoginAt).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Never"}
        </span>
      ),
    },
    {
      header: "Status",
      field: "status",
      accessor: "status",
      render: (student) => (
        <StatusBadge
          status={student.status === "active" ? "active" : "error"}
          label={student.status === "active" ? "Active" : "Blocked"}
        />
      ),
      cell: (student) => (
        <StatusBadge
          status={student.status === "active" ? "active" : "error"}
          label={student.status === "active" ? "Active" : "Blocked"}
        />
      ),
    },
    {
      header: "Actions",
      field: "_id",
      accessor: "_id",
      render: (student) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleOpenDevicesDrawer(student)}
            title="View Devices"
            className="p-1.5 text-slate-500 hover:text-[#0A192F] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(student)}
            title="Edit Student"
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setResetConfirmStudent(student)}
            title="Reset Password"
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleUnlockLogin(student)}
            title="Unlock Login"
            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleBlock(student)}
            title={student.status === "active" ? "Block Student" : "Unblock Student"}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              student.status === "active"
                ? "text-slate-500 hover:text-red-600 hover:bg-red-50"
                : "text-red-600 bg-red-50 hover:bg-red-100"
            }`}
          >
            {student.status === "active" ? (
              <ShieldAlert className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setDeleteConfirmStudent(student)}
            title="Delete Student"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      cell: (student) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleOpenDevicesDrawer(student)}
            title="View Devices"
            className="p-1.5 text-slate-500 hover:text-[#0A192F] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(student)}
            title="Edit Student"
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setResetConfirmStudent(student)}
            title="Reset Password"
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleUnlockLogin(student)}
            title="Unlock Login"
            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleBlock(student)}
            title={student.status === "active" ? "Block Student" : "Unblock Student"}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              student.status === "active"
                ? "text-slate-500 hover:text-red-600 hover:bg-red-50"
                : "text-red-600 bg-red-50 hover:bg-red-100"
            }`}
          >
            {student.status === "active" ? (
              <ShieldAlert className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setDeleteConfirmStudent(student)}
            title="Delete Student"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students Management"
        description="View registered students, manage course enrollments, reset passwords, and oversee device approvals."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Students", href: "/admin/students" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="/api/admin/students/export"
              download="students-export.csv"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Export CSV
            </a>
            <button
              onClick={() => {
                setImportResults(null);
                setPreviewData(null);
                setImportFile(null);
                setImportModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Import from Excel
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#0A192F] bg-[#FFB800] hover:bg-[#e5a600] rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, phone or login ID..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]/40 focus:border-[#FFB800] transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={courseFilter}
            onChange={(e) => {
              setCourseFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]/40"
          >
            <option value="">All Courses</option>
            {availableCourses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]/40"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>

          <select
            value={deviceFilter}
            onChange={(e) => {
              setDeviceFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]/40"
          >
            <option value="">All Device Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Request</option>
            <option value="no-device">No Device</option>
          </select>
        </div>
      </div>

      {/* Students DataTable */}
      <DataTable
        columns={columns}
        data={students}
        keyExtractor={(item) => item._id}
        loading={loading}
        hideSearch={true}
        pagination={{
          page,
          totalPages,
          total,
          limit: 20,
          onPageChange: (newPage) => setPage(newPage),
        }}
        emptyState={{
          title: "No students found",
          message:
            search || statusFilter || deviceFilter || courseFilter
              ? "No students match your filter criteria. Try clearing filters."
              : "No students exist in RD Classes yet. Click 'Add Student' or 'Import from Excel' to create student accounts.",
          actionLabel: "Add Student",
          onAction: handleOpenAdd,
        }}
      />

      {/* ================= MODAL: ADD STUDENT ================= */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Student"
        description="Create a student account. Login credentials will be generated automatically and shown once."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {formError}
            </div>
          )}

          <FormField label="Full Name" required>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#FFB800]"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Phone Number" required hint="10-digit mobile number">
              <input
                type="tel"
                required
                maxLength={10}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#FFB800]"
              />
            </FormField>

            <FormField label="Email Address" hint="Optional">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. student@example.com"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#FFB800]"
              />
            </FormField>
          </div>

          <FormField label="Custom Login ID" hint="Leave blank to auto-generate RD-YYYY-xxx">
            <input
              type="text"
              value={formData.loginId}
              onChange={(e) => setFormData({ ...formData, loginId: e.target.value.toUpperCase() })}
              placeholder="Auto-generated if left empty"
              className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:border-[#FFB800]"
            />
          </FormField>

          {availableCourses.length > 0 && (
            <FormField label="Enroll in Courses">
              <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                {availableCourses.map((c) => (
                  <label
                    key={c._id}
                    className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.courseIds.includes(c._id)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...formData.courseIds, c._id]
                          : formData.courseIds.filter((id) => id !== c._id);
                        setFormData({ ...formData, courseIds: next });
                      }}
                      className="rounded text-[#0A192F] focus:ring-[#FFB800]"
                    />
                    <span>{c.title}</span>
                  </label>
                ))}
              </div>
            </FormField>
          )}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-[#0A192F] bg-[#FFB800] hover:bg-[#e5a600] rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Creating..." : "Create Student"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: EDIT STUDENT ================= */}
      <Modal
        isOpen={!!editStudent}
        onClose={() => setEditStudent(null)}
        title="Edit Student"
        description={`Updating profile and enrollments for ${editStudent?.loginId}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {formError}
            </div>
          )}

          <FormField label="Full Name" required>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#FFB800]"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Phone Number" required>
              <input
                type="tel"
                required
                maxLength={10}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#FFB800]"
              />
            </FormField>

            <FormField label="Email Address">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#FFB800]"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Account Status">
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#FFB800]"
              >
                <option value="active">Active (Can Login)</option>
                <option value="blocked">Blocked (Login Suspended)</option>
              </select>
            </FormField>

            <FormField label="Allowed Devices Limit" hint="Default is 1 device">
              <input
                type="number"
                min={1}
                max={5}
                value={formData.maxDevices}
                onChange={(e) => setFormData({ ...formData, maxDevices: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#FFB800]"
              />
            </FormField>
          </div>

          {availableCourses.length > 0 && (
            <FormField label="Enrolled Courses">
              <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                {availableCourses.map((c) => (
                  <label
                    key={c._id}
                    className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.courseIds.includes(c._id)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...formData.courseIds, c._id]
                          : formData.courseIds.filter((id) => id !== c._id);
                        setFormData({ ...formData, courseIds: next });
                      }}
                      className="rounded text-[#0A192F] focus:ring-[#FFB800]"
                    />
                    <span>{c.title}</span>
                  </label>
                ))}
              </div>
            </FormField>
          )}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditStudent(null)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#0A192F] hover:bg-[#1E293B] rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: EXCEL IMPORT ================= */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title={importResults ? "Import Results & Credentials" : "Import Students from Excel / CSV"}
        description={
          importResults
            ? "Credentials generated for imported students. Copy WhatsApp messages or download CSV now."
            : "Upload an Excel (.xlsx) or CSV file with Name, Email, and Phone columns."
        }
        maxWidth="max-w-4xl"
      >
        {importResults ? (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">Important Security Notice:</span> Passwords cannot be viewed again. Please download the credentials CSV or copy the WhatsApp message for each student now. Later, you can only reset the password to generate a new one.
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-800">
                {importResults.length} Students Successfully Imported
              </div>
              <button
                onClick={() => downloadCredentialsCsv(importResults)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download Credentials (CSV)
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Login ID</th>
                    <th className="p-3">Generated Password</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importResults.map((cred) => (
                    <tr key={cred.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-medium text-slate-900">{cred.name}</td>
                      <td className="p-3 font-mono font-semibold text-[#0A192F]">{cred.loginId}</td>
                      <td className="p-3 font-mono text-emerald-700 font-bold bg-emerald-50/50 rounded">{cred.password}</td>
                      <td className="p-3 text-slate-600">{cred.phone}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => copyToClipboard(getWhatsAppTemplate(cred), `wa-${cred.id}`)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          {copiedKey === `wa-${cred.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy WhatsApp Msg
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setImportModalOpen(false)}
                className="px-5 py-2 text-sm font-semibold text-[#0A192F] bg-[#FFB800] hover:bg-[#e5a600] rounded-xl transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Template Download Link */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Need formatting reference? Download our pre-filled template.</span>
              </div>
              <a
                href="/api/admin/students/import/template"
                download="students-import-template.xlsx"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Download Template (.xlsx)
              </a>
            </div>

            {/* File Upload Box */}
            <div className="border-2 border-dashed border-slate-200 hover:border-[#FFB800] rounded-2xl p-6 text-center transition-colors">
              <input
                type="file"
                id="excel-file-input"
                accept=".xlsx, .xls, .csv"
                onChange={handleUploadFileForPreview}
                className="hidden"
              />
              <label
                htmlFor="excel-file-input"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <FileSpreadsheet className="w-10 h-10 text-slate-400 mb-2" />
                <span className="text-sm font-semibold text-slate-800">
                  {importFile ? importFile.name : "Click to select .xlsx or .csv file"}
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Required columns: Name, Email (optional), Phone Number
                </span>
              </label>
            </div>

            {previewLoading && (
              <div className="text-center py-6 text-sm text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#FFB800]" />
                Validating and parsing rows on server...
              </div>
            )}

            {/* Preview Table */}
            {previewData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-600 font-medium">Total: {previewData.totalCount} rows</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {previewData.validCount} valid
                    </span>
                    {previewData.invalidCount > 0 && (
                      <span className="text-red-600 font-semibold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                        {previewData.invalidCount} invalid (will be skipped)
                      </span>
                    )}
                  </div>

                  {availableCourses.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">Enroll all in:</span>
                      <select
                        value={importCourseId}
                        onChange={(e) => setImportCourseId(e.target.value)}
                        className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="">None (skip enrollment)</option>
                        {availableCourses.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2.5">Row</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Phone</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Reason / Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewData.rows.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={row.valid ? "hover:bg-slate-50/50" : "bg-red-50/40 text-red-900"}
                        >
                          <td className="p-2.5 font-mono text-slate-500">{row.rowNumber}</td>
                          <td className="p-2.5 font-medium">{row.name || "—"}</td>
                          <td className="p-2.5 font-mono">{row.phone || "—"}</td>
                          <td className="p-2.5">{row.email || "—"}</td>
                          <td className="p-2.5">
                            {row.valid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                                Invalid
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-xs">
                            {row.errors.length > 0 ? (
                              <span className="text-red-600">{row.errors.join(", ")}</span>
                            ) : (
                              <span className="text-emerald-600 font-medium">Ready to import</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setImportModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={importing || previewData.validCount === 0}
                    className="px-5 py-2 text-sm font-semibold text-[#0A192F] bg-[#FFB800] hover:bg-[#e5a600] rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {importing ? "Importing..." : `Confirm Import (${previewData.validCount} Students)`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ================= MODAL: CREDENTIALS DISPLAY (ONCE) ================= */}
      {credentialsModal && (
        <Modal
          isOpen={true}
          onClose={() => setCredentialsModal(null)}
          title={credentialsModal.title}
          description="Credentials generated for this student. Passwords cannot be retrieved later."
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">Security Rule:</span> Only password hashes are saved in MongoDB. The plain-text password shown here will never be accessible again.
              </div>
            </div>

            {credentialsModal.credentials.map((cred) => (
              <div key={cred.id || cred.loginId} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-900">{cred.name}</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`Login ID: ${cred.loginId}\nPassword: ${cred.password}`, `raw-${cred.loginId}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedKey === `raw-${cred.loginId}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(getWhatsAppTemplate(cred), `wa-cred-${cred.loginId}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedKey === `wa-cred-${cred.loginId}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy WhatsApp message
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block">Login ID</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{cred.loginId}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block">Password</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">{cred.password}</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setCredentialsModal(null)}
                className="px-5 py-2 text-sm font-semibold text-[#0A192F] bg-[#FFB800] hover:bg-[#e5a600] rounded-xl transition-colors cursor-pointer"
              >
                Close & Confirm
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= DRAWER: STUDENT DEVICES ================= */}
      {devicesDrawerStudent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {devicesDrawerStudent.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {devicesDrawerStudent.loginId} • Allowed Devices: {devicesDrawerStudent.maxDevices || 1}
                </p>
              </div>
              <button
                onClick={() => setDevicesDrawerStudent(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Drawer Devices List */}
            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              {devicesLoading ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  Loading devices...
                </div>
              ) : studentDevices.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  <Smartphone className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  No devices registered yet. First login will automatically register the student&apos;s device.
                </div>
              ) : (
                studentDevices.map((d) => (
                  <div
                    key={d._id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-slate-500" />
                        {d.deviceLabel || d.label || "Unknown Device"}
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          d.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : d.status === "pending"
                            ? "bg-amber-100 text-amber-800 animate-pulse"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {d.status?.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-0.5 font-mono">
                      <div>IP: {d.ip || "Unknown"}</div>
                      <div>
                        Last used:{" "}
                        {d.lastUsedAt
                          ? new Date(d.lastUsedAt).toLocaleString("en-IN")
                          : "Never"}
                      </div>
                    </div>

                    {d.status === "approved" && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => handleRevokeDevice(d.deviceId)}
                          className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Revoke Device
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <button
                onClick={handleLogoutEverywhere}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log out everywhere
              </button>
              <button
                onClick={() => setDevicesDrawerStudent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONFIRM DIALOG: RESET PASSWORD ================= */}
      <ConfirmDialog
        isOpen={!!resetConfirmStudent}
        onClose={() => setResetConfirmStudent(null)}
        onConfirm={handleConfirmResetPassword}
        title="Reset Student Password"
        message={`Are you sure you want to reset password for ${resetConfirmStudent?.name} (${resetConfirmStudent?.loginId})? All existing sessions will be logged out and a new 10-character password will be generated.`}
        confirmText="Generate New Password"
        variant="warning"
      />

      {/* ================= CONFIRM DIALOG: DELETE STUDENT ================= */}
      <ConfirmDialog
        isOpen={!!deleteConfirmStudent}
        onClose={() => setDeleteConfirmStudent(null)}
        onConfirm={handleConfirmDelete}
        title="Permanently Delete Student"
        message={`Are you sure you want to delete ${deleteConfirmStudent?.name} (${deleteConfirmStudent?.loginId})? This will permanently delete the student, course enrollments, registered devices, active sessions, and video progress. This cannot be undone.`}
        confirmText="Permanently Delete"
        variant="danger"
      />
    </div>
  );
}
