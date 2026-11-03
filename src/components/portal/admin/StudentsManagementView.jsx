"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDeviceLabel } from "@/lib/utils/deviceLabel";
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
  Mail,
  Send,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  Database,
  FileDown,
  RotateCcw,
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
  initialBatches = [],
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Filters state
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [batchFilter, setBatchFilter] = useState(searchParams.get("batch") || "");
  const [deviceFilter, setDeviceFilter] = useState(searchParams.get("device") || "");
  const [courseFilter, setCourseFilter] = useState(searchParams.get("course") || "");
  const [page, setPage] = useState(initialPage);
  const [batchesList, setBatchesList] = useState(initialBatches || []);

  // Data state
  const [students, setStudents] = useState(initialStudents);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);

  // Selection state for bulk actions
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(searchParams.get("add") === "1");
  const [editStudent, setEditStudent] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [devicesDrawerStudent, setDevicesDrawerStudent] = useState(null);
  const [studentDevices, setStudentDevices] = useState([]);
  const [drawerApproved, setDrawerApproved] = useState([]);
  const [drawerPending, setDrawerPending] = useState([]);
  const [drawerRejected, setDrawerRejected] = useState([]);
  const [drawerActiveSessionDeviceIds, setDrawerActiveSessionDeviceIds] = useState([]);
  const [drawerTab, setDrawerTab] = useState("approved");
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState(null);
  const [resetConfirmStudent, setResetConfirmStudent] = useState(null);
  const [sendCredentialsConfirmStudent, setSendCredentialsConfirmStudent] = useState(null);

  // Single action feedback credentials modal (shown ONCE)
  const [credentialsModal, setCredentialsModal] = useState(null);

  // Add / Edit form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    batch: "",
    loginId: "",
    maxDevices: 1,
    status: "active",
    courseIds: [],
    sendEmail: true,
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Bulk Credentials Sending Modal state
  const [bulkCredentialsModal, setBulkCredentialsModal] = useState(null);
  // { isOpen: boolean, inProgress: boolean, total: number, processed: number, stopped: boolean, results: [], error: null }

  // Import flow state
  const [importFile, setImportFile] = useState(null);
  const [importCourseId, setImportCourseId] = useState("");
  const [importSendEmail, setImportSendEmail] = useState(true);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [acceptedTypoFixes, setAcceptedTypoFixes] = useState({}); // rowNumber -> true
  const [importingChunk, setImportingChunk] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, percent: 0, interrupted: false, reason: null });
  const [importResults, setImportResults] = useState(null); // { created: [], skipped: [], interrupted: false }

  // Danger Zone state
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [dryRunData, setDryRunData] = useState(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupInfo, setBackupInfo] = useState(null);
  const [wipeConfirmText, setWipeConfirmText] = useState("");
  const [wipeAdminPassword, setWipeAdminPassword] = useState("");
  const [wipeLoading, setWipeLoading] = useState(false);
  const [wipeResult, setWipeResult] = useState(null);
  const [wipeError, setWipeError] = useState("");

  // System Maintenance & Data Repair state
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [batchDryRunLoading, setBatchDryRunLoading] = useState(false);
  const [batchApplyLoading, setBatchApplyLoading] = useState(false);
  const [batchDryRunResult, setBatchDryRunResult] = useState(null);
  const [batchFeedback, setBatchFeedback] = useState(null);

  // Reset Devices Maintenance State
  const [resetDryRunLoading, setResetDryRunLoading] = useState(false);
  const [resetApplyLoading, setResetApplyLoading] = useState(false);
  const [resetDryRunResult, setResetDryRunResult] = useState(null);
  const [resetFeedback, setResetFeedback] = useState(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [resetAdminPassword, setResetAdminPassword] = useState("");

  const handleBatchDryRun = async () => {
    try {
      setBatchDryRunLoading(true);
      setBatchFeedback(null);
      const res = await fetch("/api/admin/maintenance/fix-batches");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dry run failed");
      setBatchDryRunResult(data);
    } catch (err) {
      setBatchFeedback({ type: "error", message: err.message });
    } finally {
      setBatchDryRunLoading(false);
    }
  };

  const handleBatchApply = async (action = "apply") => {
    try {
      setBatchApplyLoading(true);
      setBatchFeedback(null);
      const res = await fetch("/api/admin/maintenance/fix-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fix failed");
      setBatchFeedback({ type: "success", message: data.message });
      setBatchDryRunResult(null);
      fetchStudents();
    } catch (err) {
      setBatchFeedback({ type: "error", message: err.message });
    } finally {
      setBatchApplyLoading(false);
    }
  };

  const handleResetDryRun = async () => {
    try {
      setResetDryRunLoading(true);
      setResetFeedback(null);
      const res = await fetch("/api/admin/maintenance/reset-devices");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset dry run failed");
      setResetDryRunResult(data);
    } catch (err) {
      setResetFeedback({ type: "error", message: err.message });
    } finally {
      setResetDryRunLoading(false);
    }
  };

  const handleApplyResetDevices = async () => {
    if (resetConfirmation.trim() !== "RESET DEVICES") {
      alert('You must type "RESET DEVICES" exactly.');
      return;
    }
    if (!resetAdminPassword.trim()) {
      alert("Admin password is required.");
      return;
    }
    try {
      setResetApplyLoading(true);
      setResetFeedback(null);
      const res = await fetch("/api/admin/maintenance/reset-devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: resetConfirmation.trim(),
          adminPassword: resetAdminPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset devices failed");
      setResetFeedback({ type: "success", message: data.message });
      setResetModalOpen(false);
      setResetConfirmation("");
      setResetAdminPassword("");
      setResetDryRunResult(null);
      fetchStudents();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setResetApplyLoading(false);
    }
  };

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
        setLoading(true);
        const q = new URLSearchParams();
        if (search.trim()) q.set("search", search.trim());
        if (statusFilter) q.set("status", statusFilter);
        if (batchFilter) q.set("batch", batchFilter);
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
          if (Array.isArray(data.batches)) {
            setBatchesList(data.batches);
          }
        }
      } catch (e) {
        console.error("Failed to load students:", e);
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
  }, [search, statusFilter, batchFilter, deviceFilter, courseFilter, page, refreshIndex]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const getWhatsAppTemplate = (cred) => {
    const site = typeof window !== "undefined" ? window.location.origin : "https://www.rd-classes.in";
    return `Hi ${cred.name}, your RD Classes login ID is ${cred.loginId} and password is ${cred.password}. Login at ${site}/student-login. Your account works on one approved device.`;
  };

  const getWhatsAppUrl = (phone, text) => {
    const cleanPhone = String(phone || "").replace(/\D/g, "");
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
  };

  // Open Add Student Modal
  const handleOpenAdd = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      batch: "",
      loginId: "",
      maxDevices: 1,
      status: "active",
      courseIds: [],
      sendEmail: true,
    });
    setFormError("");
    setAddModalOpen(true);
  };

  // Open Edit Student Modal
  const handleOpenEdit = (student) => {
    setEditStudent(student);
    let validDate = "";
    if (student.validUntil) {
      try {
        validDate = new Date(student.validUntil).toISOString().split("T")[0];
      } catch {
        validDate = "";
      }
    }
    setFormData({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      batch: student.batch || "",
      loginId: student.loginId || "",
      maxDevices: student.maxDevices || 1,
      status: student.status || "active",
      validUntil: validDate,
      courseIds: (student.enrolledCourses || []).map((c) => c._id),
      sendEmail: false,
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

  // Single Action: Send credentials (resets password and emails)
  const handleConfirmSendCredentials = async () => {
    if (!sendCredentialsConfirmStudent) return;
    try {
      const res = await fetch(`/api/admin/students/${sendCredentialsConfirmStudent._id}/send-credentials`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send credentials");

      setSendCredentialsConfirmStudent(null);
      setCredentialsModal({
        title: "New Credentials Generated & Sent",
        credentials: [data.credentials],
      });
      fetchStudents();
    } catch (err) {
      alert("Send credentials error: " + err.message);
    }
  };

  // Legacy reset password without email
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

  // Bulk Send Credentials in chunks of 5
  const handleStartBulkSendCredentials = async () => {
    if (selectedStudentIds.length === 0) return;

    setBulkCredentialsModal({
      isOpen: true,
      inProgress: true,
      total: selectedStudentIds.length,
      processed: 0,
      stopped: false,
      results: [],
      error: null,
    });

    const chunkSize = 5;
    const allIds = [...selectedStudentIds];
    const collectedResults = [];
    let stopped = false;

    for (let i = 0; i < allIds.length; i += chunkSize) {
      // Check if user requested stop
      if (window.__bulkStopRequested) {
        stopped = true;
        break;
      }

      const chunk = allIds.slice(i, i + chunkSize);
      try {
        const res = await fetch("/api/admin/students/bulk-send-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds: chunk }),
        });
        const data = await res.json();
        if (data.results) {
          collectedResults.push(...data.results);
        }
      } catch (err) {
        console.error("Chunk error:", err);
      }

      setBulkCredentialsModal((prev) => ({
        ...prev,
        processed: Math.min(i + chunkSize, allIds.length),
        results: [...collectedResults],
      }));
    }

    window.__bulkStopRequested = false;
    setBulkCredentialsModal((prev) => ({
      ...prev,
      inProgress: false,
      stopped,
      results: collectedResults,
    }));
    fetchStudents();
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
    setDrawerTab("approved");
    setDevicesLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${student._id}/devices`);
      if (res.ok) {
        const data = await res.json();
        setStudentDevices(data.devices || []);
        setDrawerApproved(data.approved || []);
        setDrawerPending(data.pending || []);
        setDrawerRejected(data.rejected || []);
        setDrawerActiveSessionDeviceIds(data.activeSessionDeviceIds || []);
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

  // Approve request from drawer
  const handleApproveFromDrawer = async (requestId, mode = "additional") => {
    if (!devicesDrawerStudent) return;
    try {
      const res = await fetch(`/api/admin/students/${devicesDrawerStudent._id}/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", requestId, mode }),
      });
      if (res.ok) {
        handleOpenDevicesDrawer(devicesDrawerStudent);
        fetchStudents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reject request from drawer
  const handleRejectFromDrawer = async (requestId, note = "") => {
    if (!devicesDrawerStudent) return;
    try {
      const res = await fetch(`/api/admin/students/${devicesDrawerStudent._id}/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", requestId, note }),
      });
      if (res.ok) {
        handleOpenDevicesDrawer(devicesDrawerStudent);
        fetchStudents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reconsider request from drawer
  const handleReconsiderFromDrawer = async (requestId) => {
    if (!devicesDrawerStudent) return;
    try {
      const res = await fetch(`/api/admin/students/${devicesDrawerStudent._id}/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reconsider", requestId }),
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

  // Unlock student login
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
    setAcceptedTypoFixes({});

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

  // Toggle typo fix acceptance
  const toggleTypoFix = (rowNumber) => {
    setAcceptedTypoFixes((prev) => ({
      ...prev,
      [rowNumber]: !prev[rowNumber],
    }));
  };

  // Get active valid rows from preview including accepted typo fixes
  const getComputedImportRows = () => {
    if (!previewData?.rows) return { validRows: [], errorRows: [] };

    const validRows = [];
    const errorRows = [];

    for (const r of previewData.rows) {
      const isTypoAccepted = acceptedTypoFixes[r.rowNumber] && r.suggestedEmail;
      if (r.valid) {
        validRows.push(r);
      } else if (isTypoAccepted) {
        validRows.push({
          ...r,
          email: r.suggestedEmail,
          valid: true,
        });
      } else {
        errorRows.push(r);
      }
    }

    return { validRows, errorRows };
  };

  // Download "Needs Fix CSV"
  const handleDownloadNeedsFixCsv = () => {
    const { errorRows } = getComputedImportRows();
    if (errorRows.length === 0) return;

    const headers = ["Row", "Serial", "Name", "Phone", "Email", "Batch", "Errors"];
    const lines = errorRows.map((r) => [
      r.rowNumber,
      `"${r.serial || ""}"`,
      `"${r.name || r.rawName || ""}"`,
      `"${r.phone || r.rawPhone || ""}"`,
      `"${r.email || r.rawEmail || ""}"`,
      `"${r.batch || r.rawBatch || ""}"`,
      `"${r.errors.join("; ")}"`,
    ]);

    const csvContent = [headers.join(","), ...lines.map((l) => l.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `import_needs_fix_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import: Confirm Import in 10-row chunks
  const handleConfirmChunkedImport = async () => {
    const { validRows } = getComputedImportRows();
    if (validRows.length === 0) return;

    setImportingChunk(true);
    const chunkSize = 10;
    const totalCount = validRows.length;
    const allResults = [];
    const allSkipped = [];
    let isInterrupted = false;
    let interruptedReason = null;

    setImportProgress({
      current: 0,
      total: totalCount,
      percent: 0,
      interrupted: false,
      reason: null,
    });

    for (let i = 0; i < totalCount; i += chunkSize) {
      if (window.__importStopRequested) {
        break;
      }

      const chunk = validRows.slice(i, i + chunkSize);
      try {
        const res = await fetch("/api/admin/students/import/execute-chunk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: chunk,
            courseId: importCourseId || null,
            sendEmail: importSendEmail,
          }),
        });

        const data = await res.json();
        if (data.results) allResults.push(...data.results);
        if (data.skipped) allSkipped.push(...data.skipped);

        if (data.emailInterrupted) {
          isInterrupted = true;
          interruptedReason = data.interruptedReason;
          break;
        }
      } catch (err) {
        console.error("Chunk import error:", err);
      }

      const processedCount = Math.min(i + chunkSize, totalCount);
      setImportProgress({
        current: processedCount,
        total: totalCount,
        percent: Math.round((processedCount / totalCount) * 100),
        interrupted: isInterrupted,
        reason: interruptedReason,
      });
    }

    window.__importStopRequested = false;
    setImportingChunk(false);
    setImportResults({
      created: allResults,
      skipped: allSkipped,
      interrupted: isInterrupted,
      reason: interruptedReason,
    });
    setPreviewData(null);
    fetchStudents();
  };

  // Download Credentials CSV from results (Login ID, Name, Phone, Password, Email Status)
  const downloadCredentialsCsv = (creds) => {
    const headers = ["Login ID", "Name", "Phone", "Password", "Email Status"];
    const rows = creds.map((c) => [
      `"${c.loginId}"`,
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.password}"`,
      `"${c.emailStatus || "not_sent"}"`,
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

  // Danger Zone Step 1: Dry Run
  const handleDryRun = async () => {
    setDryRunLoading(true);
    setDryRunData(null);
    setWipeError("");
    try {
      const res = await fetch("/api/admin/students/delete-all/dry-run", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to calculate dry run impact");
      setDryRunData(data.report);
    } catch (err) {
      setWipeError(err.message);
    } finally {
      setDryRunLoading(false);
    }
  };

  // Danger Zone Step 2: Backup Archive & JSON download
  const handleBackup = async () => {
    setBackupLoading(true);
    setWipeError("");
    try {
      const res = await fetch("/api/admin/students/delete-all/backup", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create archive backup");

      setBackupInfo(data);

      // Trigger sanitized JSON download (NO password hashes!)
      const jsonContent = JSON.stringify(data.sanitizedStudents || [], null, 2);
      const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `students_backup_${data.timestamp}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setWipeError(err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  // Danger Zone Step 3: Confirm Wipe
  const handleExecuteWipe = async () => {
    if (wipeConfirmText !== "DELETE ALL STUDENTS") {
      setWipeError("Confirmation text must match 'DELETE ALL STUDENTS' exactly.");
      return;
    }
    if (!wipeAdminPassword) {
      setWipeError("Admin password is required to authorize deletion.");
      return;
    }

    setWipeLoading(true);
    setWipeError("");
    try {
      const res = await fetch("/api/admin/students/delete-all/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmationText: wipeConfirmText,
          adminPassword: wipeAdminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to wipe students");

      setWipeResult(data);
      setDryRunData(null);
      setBackupInfo(null);
      setWipeConfirmText("");
      setWipeAdminPassword("");
      fetchStudents();
    } catch (err) {
      setWipeError(err.message);
    } finally {
      setWipeLoading(false);
    }
  };

  // Format last login timestamp
  const formatLastLogin = (dateStr) => {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Never";
    const day = d.toLocaleDateString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" });
    const month = d.toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" });
    const time = d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
    return `${day} ${month}, ${time}`;
  };

  // Toggle selection for all visible students
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudentIds(students.map((s) => s._id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggleSelectStudent = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const { validRows, errorRows } = getComputedImportRows();

  // DataTable columns definition
  const columns = [
    {
      header: (
        <input
          type="checkbox"
          checked={students.length > 0 && selectedStudentIds.length === students.length}
          onChange={handleSelectAll}
          className="rounded border-slate-300 text-[#0A192F] focus:ring-[#FFB800] cursor-pointer"
        />
      ),
      field: "_select",
      accessor: "_id",
      render: (student) => (
        <input
          type="checkbox"
          checked={selectedStudentIds.includes(student._id)}
          onChange={() => handleToggleSelectStudent(student._id)}
          className="rounded border-slate-300 text-[#0A192F] focus:ring-[#FFB800] cursor-pointer"
        />
      ),
    },
    {
      header: "Student",
      field: "name",
      accessor: "name",
      render: (student) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#0A192F] text-[#FFB800] font-bold flex items-center justify-center text-xs shrink-0 select-none">
            {student.name ? student.name.charAt(0).toUpperCase() : "S"}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 truncate max-w-[130px]" title={student.name}>
              {student.name}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              <span className="text-[11px] text-slate-500 font-mono">{student.loginId}</span>
              {student.batch && (
                <span className="inline-block rounded bg-amber-500/10 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 border border-amber-500/20">
                  {student.batch}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Contact",
      field: "phone",
      accessor: "phone",
      render: (student) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800 whitespace-nowrap">{student.phone || "—"}</div>
          <div className="text-[11px] text-slate-500 truncate max-w-[110px]" title={student.email || ""}>
            {student.email || "No email"}
          </div>
        </div>
      ),
    },
    {
      header: "Email Status",
      field: "emailStatus",
      accessor: "emailStatus",
      render: (student) => {
        const status = student.emailStatus || (student.email ? "not_sent" : "no_email");
        if (status === "sent") {
          return (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200"
              title={student.emailSentAt ? `Sent: ${new Date(student.emailSentAt).toLocaleString()}` : "Delivered"}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Sent
            </span>
          );
        }
        if (status === "failed") {
          return (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 border border-red-200"
              title={student.emailError ? `Error: ${student.emailError}` : "Delivery failed"}
            >
              <XCircle className="w-3 h-3 text-red-600" />
              Failed
            </span>
          );
        }
        if (status === "not_sent") {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
              Not sent
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
            No email
          </span>
        );
      },
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
          <div className="flex flex-wrap gap-1 max-w-[130px]">
            {courses.slice(0, 2).map((c) => (
              <span
                key={c._id || c.slug}
                title={c.title}
                className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 truncate max-w-[100px]"
              >
                {c.title}
              </span>
            ))}
            {courses.length > 2 && (
              <span className="text-[10px] text-slate-500 font-medium">
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
        const isTablet = fd?.type === "tablet" || fd?.os?.toLowerCase().includes("ipad");
        const isMobile =
          fd?.type === "mobile" ||
          fd?.os?.toLowerCase().includes("android") ||
          fd?.os?.toLowerCase().includes("ios");
        const loc = [fd?.city, fd?.country].filter(Boolean).join(", ");

        return (
          <div className="min-w-0 max-w-[170px]">
            {fd ? (
              <>
                <div className="flex items-center gap-1.5 text-xs text-slate-800">
                  {isTablet ? (
                    <Tablet className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  ) : isMobile ? (
                    <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  ) : (
                    <Laptop className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <span className="truncate font-semibold text-slate-800" title={fd.label}>
                    {fd.label}
                  </span>
                </div>
                {fd.ip && (
                  <div
                    className="text-[10px] text-slate-400 font-mono truncate mt-0.5"
                    title={`${fd.ip} ${loc ? `· ${loc}` : ""}`}
                  >
                    {fd.ip}
                    {loc ? ` · ${loc}` : ""}
                  </div>
                )}
                <div className="mt-1 flex items-center gap-1 flex-wrap">
                  {student.approvedDeviceCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                      {student.approvedDeviceCount} approved
                    </span>
                  )}
                  {student.pendingDeviceCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                      <Clock className="w-2.5 h-2.5 text-amber-600" />
                      {student.pendingDeviceCount} pending
                    </span>
                  )}
                </div>
              </>
            ) : (
              <span className="text-xs text-slate-400 italic">None</span>
            )}
          </div>
        );
      },
    },
    {
      header: "Last Login",
      field: "lastLoginAt",
      accessor: "lastLoginAt",
      render: (student) => (
        <div className="whitespace-nowrap">
          <div className="text-xs text-slate-700 font-medium whitespace-nowrap">
            {formatLastLogin(student.lastLoginAt)}
          </div>
          {student.lastLoginIp && (
            <div className="text-[10px] text-slate-400 font-mono mt-0.5" title={`IP: ${student.lastLoginIp}`}>
              {student.lastLoginIp}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      field: "status",
      accessor: "status",
      render: (student) => (
        <div className="whitespace-nowrap">
          <StatusBadge
            status={student.status === "active" ? "active" : "error"}
            label={student.status === "active" ? "Active" : "Blocked"}
          />
        </div>
      ),
    },
    {
      header: "Actions",
      field: "_id",
      accessor: "_id",
      sticky: "right",
      render: (student) => (
        <div className="flex items-center justify-end gap-0.5 whitespace-nowrap">
          <button
            onClick={() => setSendCredentialsConfirmStudent(student)}
            title="Send credentials (resets password & emails)"
            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleOpenDevicesDrawer(student)}
            title="View Devices"
            className="p-1.5 text-slate-500 hover:text-[#0A192F] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleOpenEdit(student)}
            title="Edit Student"
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setResetConfirmStudent(student)}
            title="Reset Password (legacy)"
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleUnlockLogin(student)}
            title="Unlock Login"
            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
          >
            <Unlock className="w-3.5 h-3.5" />
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
              <ShieldAlert className="w-3.5 h-3.5" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={() => setDeleteConfirmStudent(student)}
            title="Delete Student"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Students Management"
        description="View registered students, manage batch assignments, reset & email credentials, and oversee device approvals."
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

      {/* Floating Bulk Action Bar when students are selected */}
      {selectedStudentIds.length > 0 && (
        <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#FFB800] animate-pulse" />
            <span>{selectedStudentIds.length} student{selectedStudentIds.length === 1 ? "" : "s"} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartBulkSendCredentials}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFB800] hover:bg-[#e5a600] text-[#0A192F] text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Send credentials ({selectedStudentIds.length})
            </button>
            <button
              onClick={() => setSelectedStudentIds([])}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

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
            placeholder="Search by name, email, phone, batch or login ID..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]/40 focus:border-[#FFB800] transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Batches Filter */}
          <select
            value={batchFilter}
            onChange={(e) => {
              setBatchFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]/40"
          >
            <option value="">All Batches</option>
            {batchesList.map((b) => (
              <option key={b} value={b}>
                Batch {b}
              </option>
            ))}
          </select>

          {/* Courses Filter */}
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

          {/* Status Filter */}
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

          {/* Device Filter */}
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
          onPageChange: (p) => setPage(p),
        }}
      />

      {/* ================= SYSTEM MAINTENANCE & FIX TOOLS (COLLAPSIBLE) ================= */}
      <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-5 sm:p-6 shadow-xs">
        <div
          onClick={() => setMaintenanceOpen(!maintenanceOpen)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700 border border-sky-200 shrink-0">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-sky-950 flex items-center gap-2">
                System Maintenance & Data Repairs
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-100 text-sky-800 rounded-full border border-sky-300">
                  Owner Tools
                </span>
              </h3>
              <p className="text-xs text-sky-700">
                Safe dry-run diagnostic and repair actions for student devices and batch numbers.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 text-sky-700 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
          >
            {maintenanceOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {maintenanceOpen && (
          <div className="mt-6 pt-5 border-t border-sky-200/80 space-y-6 animate-in fade-in duration-150">
            {/* TOOL 1: FIX BATCH VALUES */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                    Fix Batch Values (Excel Date Serials)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Converts corrupted 5-digit Excel date serials (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-700">46117</code> &rarr; <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-semibold">4-5</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-700">46148</code> &rarr; <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-semibold">5-6</code>) back to standard readable batch slots. Safe & reversible (preserves raw value).
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleBatchDryRun}
                    disabled={batchDryRunLoading || batchApplyLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {batchDryRunLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                    Dry Run
                  </button>
                </div>
              </div>

              {batchFeedback && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 border ${
                    batchFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}
                >
                  {batchFeedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{batchFeedback.message}</span>
                </div>
              )}

              {batchDryRunResult && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>
                      Identified {batchDryRunResult.count} student(s) with numeric date serial batch values
                    </span>
                    <span className="text-slate-500 font-normal">Dry Run Result</span>
                  </div>

                  {batchDryRunResult.mappings?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {batchDryRunResult.mappings.map((m, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-slate-200 rounded-md p-2 flex items-center justify-between"
                        >
                          <span className="font-mono text-amber-700 font-semibold">{m.from}</span>
                          <span className="text-slate-400">&rarr;</span>
                          <span className="font-mono text-emerald-700 font-bold">{m.to}</span>
                          <span className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {m.count} student(s)
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No corrupted batch values found. All batches are clean!</p>
                  )}

                  {batchDryRunResult.count > 0 && (
                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleBatchApply("apply")}
                        disabled={batchApplyLoading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {batchApplyLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Apply Fix ({batchDryRunResult.count} students)
                      </button>
                    </div>
                  )}

                  {batchDryRunResult.canRollback && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        Rollback available for {batchDryRunResult.rollbackCount} student(s)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleBatchApply("rollback")}
                        disabled={batchApplyLoading}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-800 underline cursor-pointer"
                      >
                        Rollback to Raw Values
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* TOOL 2: RESET STUDENT DEVICES */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-600" />
                    Reset Devices (Archive & Re-adopt All Student Devices)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Safely resets device records to apply new device recognition rules. Archives all devices &amp; requests to timestamped collections (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">devices_archive_YYYYMMDD_HHmm</code>), deletes existing device records, and unbinds active sessions without logging students out. At their next request, active students automatically re-register their current device. Student accounts, passwords, enrolments, batch assignments, and learning progress remain 100% untouched.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetDryRun}
                    disabled={resetDryRunLoading || resetApplyLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {resetDryRunLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                    Dry Run Reset
                  </button>
                </div>
              </div>

              {resetFeedback && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 border ${
                    resetFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}
                >
                  {resetFeedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{resetFeedback.message}</span>
                </div>
              )}

              {resetDryRunResult && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-800 border-b border-slate-200 pb-2">
                    <span>Dry Run Impact Summary</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Safe Archive Mode
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="text-base font-bold text-slate-800">
                        {resetDryRunResult.counts?.devices || 0}
                      </div>
                      <div className="text-[10px] text-slate-500">Devices to Archive</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="text-base font-bold text-slate-800">
                        {resetDryRunResult.counts?.requests || 0}
                      </div>
                      <div className="text-[10px] text-slate-500">Requests to Archive</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="text-base font-bold text-slate-800">
                        {resetDryRunResult.counts?.sessionsToUnbind || 0}
                      </div>
                      <div className="text-[10px] text-slate-500">Sessions to Unbind</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="text-base font-bold text-slate-800">
                        {resetDryRunResult.counts?.studentsAffected || 0}
                      </div>
                      <div className="text-[10px] text-slate-500">Students Logged In</div>
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">
                      Strictly Untouched Data (Verified Safe):
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                      {(resetDryRunResult.notTouched || []).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setResetConfirmation("");
                        setResetAdminPassword("");
                        setResetModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Apply Reset Devices...
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= DANGER ZONE SECTION (COLLAPSIBLE) ================= */}
      <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 sm:p-6 shadow-xs">
        <div
          onClick={() => setDangerZoneOpen(!dangerZoneOpen)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 border border-red-200 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-950 flex items-center gap-2">
                Danger Zone: Wipe All Students & Restart Sequence
              </h3>
              <p className="text-xs text-red-700">
                Safeguarded 3-step destructive flow: Dry-run impact analysis &rarr; Archive backup &rarr; Confirmation.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 text-red-700 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
          >
            {dangerZoneOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {dangerZoneOpen && (
          <div className="mt-6 pt-5 border-t border-red-200/80 space-y-6 animate-in fade-in duration-150">
            {wipeError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-100 p-3 text-xs font-semibold text-red-800 border border-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{wipeError}</span>
              </div>
            )}

            {wipeResult && (
              <div className="rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-300 space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Wipe Operation Successful
                </div>
                <p>Deleted {wipeResult.deletedCount} student accounts and dependents.</p>
                <p className="font-mono text-emerald-950">Next student login ID sequence reset to: {wipeResult.nextLoginId}</p>
              </div>
            )}

            {/* Stepper Guide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1: Dry Run */}
              <div className="bg-white rounded-xl border border-red-200 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700 text-[11px]">1</span>
                  Dry Run Impact
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Read-only calculation of exact student records to be wiped vs protected institute content.
                </p>
                <button
                  type="button"
                  onClick={handleDryRun}
                  disabled={dryRunLoading}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {dryRunLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                  Calculate Impact
                </button>
              </div>

              {/* Step 2: Backup */}
              <div className={`bg-white rounded-xl border p-4 space-y-3 ${dryRunData?.toDelete?.students > 0 ? "border-red-200" : "border-slate-200 opacity-60"}`}>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700 text-[11px]">2</span>
                  Archive & Download
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Clones records to timestamped archive collections and downloads sanitized JSON (no passwords).
                </p>
                <button
                  type="button"
                  onClick={handleBackup}
                  disabled={backupLoading || !dryRunData || dryRunData.toDelete.students === 0}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {backupLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                  Archive & Download JSON
                </button>
              </div>

              {/* Step 3: Confirmation */}
              <div className={`bg-white rounded-xl border p-4 space-y-3 ${backupInfo ? "border-red-300 bg-red-50/20" : "border-slate-200 opacity-60"}`}>
                <div className="flex items-center gap-2 text-xs font-bold text-red-950 uppercase tracking-wider">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white text-[11px]">3</span>
                  Confirm & Wipe
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Requires confirmation phrase and your admin password before resetting counter to RD-2026-001.
                </p>
                <div className="text-[11px] font-semibold text-red-700">
                  {backupInfo ? "Ready for confirmation" : "Complete Steps 1 & 2 first"}
                </div>
              </div>
            </div>

            {/* Dry Run Detailed Results View */}
            {dryRunData && (
              <div className="bg-white rounded-2xl border border-red-200 p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-red-600" />
                  Wipe Impact Report
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* To Delete Column */}
                  <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-2">
                    <div className="font-bold text-red-950 border-b border-red-200 pb-1.5 flex justify-between">
                      <span>Will Be Permanently Deleted</span>
                      <span className="text-red-700 font-mono">({dryRunData.toDelete.students} Students)</span>
                    </div>
                    <ul className="space-y-1 text-red-900 font-medium text-[11px]">
                      <li>&bull; Students (role: student): <strong>{dryRunData.toDelete.students}</strong></li>
                      <li>&bull; Registered Devices: <strong>{dryRunData.toDelete.devices}</strong></li>
                      <li>&bull; Active Sessions: <strong>{dryRunData.toDelete.sessions}</strong></li>
                      <li>&bull; Course Enrollments: <strong>{dryRunData.toDelete.enrollments}</strong></li>
                      <li>&bull; Lecture Progress Logs: <strong>{dryRunData.toDelete.lectureProgress}</strong></li>
                      <li>&bull; Student Notifications: <strong>{dryRunData.toDelete.studentNotifications}</strong></li>
                    </ul>
                  </div>

                  {/* Guaranteed Safe Column */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                    <div className="font-bold text-emerald-950 border-b border-emerald-200 pb-1.5 flex justify-between">
                      <span>Guaranteed Safe (Never Touched)</span>
                      <span className="text-emerald-700 font-mono">Preserved</span>
                    </div>
                    <ul className="space-y-1 text-emerald-900 font-medium text-[11px]">
                      <li>&bull; Admin Accounts: <strong>{dryRunData.toStay.adminAccounts}</strong> (can still log in)</li>
                      <li>&bull; Courses & Lectures: <strong>{dryRunData.toStay.courses} Courses, {dryRunData.toStay.lectures} Lectures</strong></li>
                      <li>&bull; Books & Chapters: <strong>{dryRunData.toStay.books} Books, {dryRunData.toStay.chapters} Chapters</strong></li>
                      <li>&bull; Notes & Study PDFs: <strong>{dryRunData.toStay.notes}</strong></li>
                      <li>&bull; Tests & Results: <strong>{dryRunData.toStay.tests} Tests, {dryRunData.toStay.results} Results</strong></li>
                      <li>&bull; Gallery, Announcements & Settings: <strong>Preserved</strong></li>
                    </ul>
                  </div>
                </div>

                {dryRunData.toDelete.students === 0 && (
                  <p className="text-xs text-amber-700 font-medium italic">
                    There are currently 0 students in the database. Deletion is disabled.
                  </p>
                )}
              </div>
            )}

            {/* Step 3 Form when Backup is Ready */}
            {backupInfo && (
              <div className="bg-red-100/60 rounded-2xl border border-red-300 p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-red-950">
                  <ShieldAlert className="w-4 h-4 text-red-700" />
                  Authorization Required to Execute Deletion
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-red-900 mb-1">
                      Type <span className="font-mono bg-red-200 px-1 py-0.5 rounded text-red-950 select-all">DELETE ALL STUDENTS</span>
                    </label>
                    <input
                      type="text"
                      value={wipeConfirmText}
                      onChange={(e) => setWipeConfirmText(e.target.value)}
                      placeholder="DELETE ALL STUDENTS"
                      className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-red-900 mb-1">
                      Enter Your Admin Password
                    </label>
                    <input
                      type="password"
                      value={wipeAdminPassword}
                      onChange={(e) => setWipeAdminPassword(e.target.value)}
                      placeholder="Admin password"
                      className="w-full text-xs px-3 py-2 bg-white border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleExecuteWipe}
                    disabled={wipeLoading || wipeConfirmText !== "DELETE ALL STUDENTS" || !wipeAdminPassword}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {wipeLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Permanently Delete All Students & Restart Sequence
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= MODAL: ADD STUDENT ================= */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Student"
        description="Creates student account, generates strong credentials, and optionally emails login details."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl">
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
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Phone Number" helper="10 digits Indian mobile">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9811122334"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
              />
            </FormField>

            <FormField label="Batch (Optional)" helper="e.g. 4-5 or 5-6">
              <input
                type="text"
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                placeholder="4-5"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
              />
            </FormField>
          </div>

          <FormField label="Email ID (Optional)" helper="For sending credentials">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="student@example.com"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
            />
          </FormField>

          {/* Email credentials toggle */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={formData.sendEmail && Boolean(formData.email && formData.email.includes("@"))}
                disabled={!formData.email || !formData.email.includes("@")}
                onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                className="rounded border-slate-300 text-[#0A192F] focus:ring-[#FFB800]"
              />
              <span>Email login details to the student immediately</span>
            </label>
            {(!formData.email || !formData.email.includes("@")) && (
              <p className="text-[11px] text-slate-500 pl-5">
                Enter a valid email address above to enable automatic email delivery.
              </p>
            )}
          </div>

          {availableCourses.length > 0 && (
            <FormField label="Enroll in Course(s)">
              <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2.5">
                {availableCourses.map((c) => (
                  <label
                    key={c._id}
                    className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.courseIds.includes(c._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            courseIds: [...formData.courseIds, c._id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            courseIds: formData.courseIds.filter((id) => id !== c._id),
                          });
                        }
                      }}
                      className="rounded border-slate-300 text-[#0A192F] focus:ring-[#FFB800]"
                    />
                    <span>{c.title}</span>
                  </label>
                ))}
              </div>
            </FormField>
          )}

          <div className="flex justify-end gap-2.5 pt-3">
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
      {editStudent && (
        <Modal
          isOpen={true}
          onClose={() => setEditStudent(null)}
          title={`Edit Student: ${editStudent.name}`}
          description="Update student contact information, batch assignment, and device limit."
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl">
                {formError}
              </div>
            )}

            <FormField label="Full Name" required>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Phone Number">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                />
              </FormField>

              <FormField label="Batch" helper="e.g. 4-5 or 5-6">
                <input
                  type="text"
                  value={formData.batch}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                  placeholder="4-5"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                />
              </FormField>
            </div>

            <FormField label="Email ID">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Device Limit">
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.maxDevices}
                  onChange={(e) => setFormData({ ...formData, maxDevices: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                />
              </FormField>

              <FormField label="Status">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                >
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </select>
              </FormField>
            </div>

            {availableCourses.length > 0 && (
              <FormField label="Enrolled Courses">
                <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2.5">
                  {availableCourses.map((c) => (
                    <label
                      key={c._id}
                      className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.courseIds.includes(c._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              courseIds: [...formData.courseIds, c._id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              courseIds: formData.courseIds.filter((id) => id !== c._id),
                            });
                          }
                        }}
                        className="rounded border-slate-300 text-[#0A192F] focus:ring-[#FFB800]"
                      />
                      <span>{c.title}</span>
                    </label>
                  ))}
                </div>
              </FormField>
            )}

            <div className="flex justify-end gap-2.5 pt-3">
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
                className="px-5 py-2 text-sm font-semibold text-[#0A192F] bg-[#FFB800] hover:bg-[#e5a600] rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= MODAL: BULK CREDENTIALS SENDING ================= */}
      {bulkCredentialsModal && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (!bulkCredentialsModal.inProgress) setBulkCredentialsModal(null);
          }}
          title="Bulk Send Credentials"
          description="Sends updated credentials in chunks of 5 with 1-second delay."
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>
                  {bulkCredentialsModal.inProgress
                    ? `Processing ${bulkCredentialsModal.processed} of ${bulkCredentialsModal.total}...`
                    : bulkCredentialsModal.stopped
                    ? "Sending stopped by user"
                    : "Completed"}
                </span>
                <span>{Math.round((bulkCredentialsModal.processed / bulkCredentialsModal.total) * 100)}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0A192F] transition-all duration-300"
                  style={{ width: `${Math.round((bulkCredentialsModal.processed / bulkCredentialsModal.total) * 100)}%` }}
                />
              </div>
            </div>

            {bulkCredentialsModal.inProgress && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    window.__bulkStopRequested = true;
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors cursor-pointer"
                >
                  Stop Sending
                </button>
              </div>
            )}

            {!bulkCredentialsModal.inProgress && (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
                  Processed {bulkCredentialsModal.results.length} students.
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const creds = bulkCredentialsModal.results.map((r) => r.student).filter(Boolean);
                      downloadCredentialsCsv(creds);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Credentials CSV
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkCredentialsModal(null)}
                    className="px-5 py-2 text-xs font-bold text-[#0A192F] bg-[#FFB800] hover:bg-[#e5a600] rounded-xl transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ================= MODAL: IMPORT FROM EXCEL / CSV ================= */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Students from Excel / CSV"
        description="Upload student spreadsheet (.xlsx, .csv). Cleans names, validates 10-digit mobiles, detects typos, and emails credentials."
        maxWidth="max-w-4xl"
      >
        {importResults ? (
          <div className="space-y-5">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Import Complete: {importResults.created.length} students created
              </div>
              <p className="text-xs text-emerald-700">
                {importResults.interrupted
                  ? `Note: Email delivery paused due to Gmail rate limit (${importResults.reason}). Remaining rows marked 'Not sent'.`
                  : "All students processed successfully."}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl">
              <div className="space-y-1">
                <div className="text-sm font-bold">Download Credentials CSV</div>
                <p className="text-xs text-amber-300">
                  Save this file safely. Passwords cannot be shown again.
                </p>
              </div>
              <button
                type="button"
                onClick={() => downloadCredentialsCsv(importResults.created)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FFB800] hover:bg-[#e5a600] text-[#0A192F] text-xs font-extrabold rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Credentials CSV
              </button>
            </div>

            {/* Imported Students Quick Table */}
            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5">Login ID</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Batch</th>
                    <th className="p-2.5">Phone</th>
                    <th className="p-2.5">Email Status</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importResults.created.map((st) => (
                    <tr key={st.id || st.loginId} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-mono font-bold text-slate-900">{st.loginId}</td>
                      <td className="p-2.5 font-medium">{st.name}</td>
                      <td className="p-2.5">{st.batch || "—"}</td>
                      <td className="p-2.5 font-mono">{st.phone || "—"}</td>
                      <td className="p-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          st.emailStatus === "sent" ? "bg-emerald-100 text-emerald-800" :
                          st.emailStatus === "failed" ? "bg-red-100 text-red-800" :
                          st.emailStatus === "no_email" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800"
                        }`}>
                          {st.emailStatus?.toUpperCase() || "NOT_SENT"}
                        </span>
                      </td>
                      <td className="p-2.5 text-right whitespace-nowrap">
                        <a
                          href={getWhatsAppUrl(st.phone, getWhatsAppTemplate(st))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#128C7E] hover:underline"
                        >
                          WhatsApp &rarr;
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setImportModalOpen(false);
                  setImportResults(null);
                }}
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
                <span>Columns: Serial Number, Name, Email ID, Phone Number, Batch (e.g. 4-5, 5-6).</span>
              </div>
              <a
                href="/api/admin/students/import/template"
                download="students-import-template.xlsx"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Template (.xlsx)
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
                  {importFile ? importFile.name : "Click to select .xlsx or .csv spreadsheet"}
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Handles mixed-case names, phone spaces/prefixes, batch variations &amp; sibling contacts.
                </span>
              </label>
            </div>

            {previewLoading && (
              <div className="text-center py-6 text-sm text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#FFB800]" />
                Parsing spreadsheet and validating contacts...
              </div>
            )}

            {/* Progress Screen when importing */}
            {importingChunk && (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Importing students in chunks of 10 with email delivery...</span>
                  <span>{importProgress.current} / {importProgress.total}</span>
                </div>
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0A192F] transition-all duration-300"
                    style={{ width: `${importProgress.percent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Generating sequential login IDs and emailing credentials (1 mail/sec throttle).
                </p>
              </div>
            )}

            {/* Preview Table */}
            {previewData && !importingChunk && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-slate-600 font-medium">Total: {previewData.totalCount} rows</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {validRows.length} valid
                    </span>
                    {previewData.warningCount > 0 && (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {previewData.warningCount} with warnings (allowed)
                      </span>
                    )}
                    {errorRows.length > 0 && (
                      <span className="inline-flex items-center gap-1 font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        <XCircle className="w-3 h-3 text-red-500" />
                        {errorRows.length} needs fix / errors
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {availableCourses.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-600 text-[11px]">Enroll all in:</span>
                        <select
                          value={importCourseId}
                          onChange={(e) => setImportCourseId(e.target.value)}
                          className="px-2 py-1 text-xs font-medium border border-slate-200 rounded-lg bg-white"
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

                    {errorRows.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDownloadNeedsFixCsv}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        <FileDown className="w-3 h-3" />
                        Download Needs Fix CSV
                      </button>
                    )}
                  </div>
                </div>

                {/* Email Immediate Sending Toggle */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-950">
                    <input
                      type="checkbox"
                      checked={importSendEmail}
                      onChange={(e) => setImportSendEmail(e.target.checked)}
                      className="rounded border-amber-300 text-[#0A192F] focus:ring-[#FFB800]"
                    />
                    <span>Email login details to every student immediately</span>
                  </label>
                  <span className="text-amber-700 text-[11px]">Throttled 1 mail/sec</span>
                </div>

                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2.5">Row</th>
                        <th className="p-2.5">Cleaned Name</th>
                        <th className="p-2.5">Cleaned Phone</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Batch</th>
                        <th className="p-2.5">Status & Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewData.rows.map((row) => {
                        const isTypo = row.hasTypoSuggestion;
                        const isAccepted = acceptedTypoFixes[row.rowNumber];
                        const isCurrentlyValid = row.valid || isAccepted;

                        return (
                          <tr
                            key={row.rowNumber}
                            className={isCurrentlyValid ? "hover:bg-slate-50/50" : "bg-red-50/40 text-red-950"}
                          >
                            <td className="p-2.5 font-mono text-slate-500">{row.rowNumber}</td>
                            <td className="p-2.5 font-medium">{row.name || "—"}</td>
                            <td className="p-2.5 font-mono">{row.phone || "—"}</td>
                            <td className="p-2.5">
                              {isTypo ? (
                                <div className="space-y-1">
                                  <div className="line-through text-red-600">{row.rawEmail}</div>
                                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(isAccepted)}
                                      onChange={() => toggleTypoFix(row.rowNumber)}
                                      className="rounded border-blue-300 text-blue-600"
                                    />
                                    Fix to {row.suggestedEmail}
                                  </label>
                                </div>
                              ) : (
                                row.email || "—"
                              )}
                            </td>
                            <td className="p-2.5 font-medium">{row.batch || "—"}</td>
                            <td className="p-2.5 text-xs">
                              {isCurrentlyValid ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                    Ready to import
                                  </span>
                                  {row.warnings.map((w, idx) => (
                                    <div key={idx} className="text-[10px] text-amber-700 font-medium">
                                      &bull; {w}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-red-600 font-medium">
                                  {row.errors.join(", ")}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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
                    onClick={handleConfirmChunkedImport}
                    disabled={importingChunk || validRows.length === 0}
                    className="px-5 py-2 text-sm font-semibold text-[#0A192F] bg-[#FFB800] hover:bg-[#e5a600] rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    Import {validRows.length} Valid Rows
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
                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-slate-900">{cred.name}</div>
                    {cred.emailStatus && (
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        cred.emailStatus === "sent" ? "bg-emerald-100 text-emerald-800" :
                        cred.emailStatus === "failed" ? "bg-red-100 text-red-800" :
                        cred.emailStatus === "no_email" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800"
                      }`}>
                        Email: {cred.emailStatus.toUpperCase()} {cred.emailError ? `(${cred.emailError})` : ""}
                      </span>
                    )}
                  </div>
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
                    <a
                      href={getWhatsAppUrl(cred.phone, getWhatsAppTemplate(cred))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Share on WhatsApp
                    </a>
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

      {/* ================= CONFIRM DIALOG: SEND CREDENTIALS ================= */}
      <ConfirmDialog
        isOpen={!!sendCredentialsConfirmStudent}
        onClose={() => setSendCredentialsConfirmStudent(null)}
        onConfirm={handleConfirmSendCredentials}
        title="Reset & Email New Credentials"
        message={`This will reset ${sendCredentialsConfirmStudent?.name}'s password to a newly generated 10-character password and email it immediately to ${sendCredentialsConfirmStudent?.email || "their registered email"}. Old sessions will be revoked.`}
        confirmText="Reset & Email Password"
        variant="warning"
      />

      {/* ================= CONFIRM DIALOG: RESET PASSWORD (LEGACY) ================= */}
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

      {/* ================= RESET DEVICES CONFIRMATION MODAL ================= */}
      {resetModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setResetModalOpen(false)}
          title="Confirm: Reset All Devices"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
              <p className="font-bold text-amber-800 mb-1">
                Warning: You are preparing to reset all student devices
              </p>
              <p className="leading-relaxed">
                All devices and requests will be safely archived to <code className="bg-white/80 px-1 py-0.5 rounded font-mono">devices_archive_YYYYMMDD_HHmm</code> collections. Active student sessions will be unbound but NOT logged out; each student will automatically re-register their current device at their next request.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Type <span className="font-mono text-amber-700 bg-amber-50 px-1 py-0.5 rounded">RESET DEVICES</span> to confirm:
                </label>
                <input
                  type="text"
                  value={resetConfirmation}
                  onChange={(e) => setResetConfirmation(e.target.value)}
                  placeholder="RESET DEVICES"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Admin Password:
                </label>
                <input
                  type="password"
                  value={resetAdminPassword}
                  onChange={(e) => setResetAdminPassword(e.target.value)}
                  placeholder="Enter your admin password"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={resetApplyLoading}
                onClick={() => setResetModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetApplyLoading || resetConfirmation.trim() !== "RESET DEVICES" || !resetAdminPassword.trim()}
                onClick={handleApplyResetDevices}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {resetApplyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                Archive & Reset Devices
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= DRAWER: STUDENT DEVICES ================= */}
      {devicesDrawerStudent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {devicesDrawerStudent.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {devicesDrawerStudent.loginId} &bull; Allowed Limit: {devicesDrawerStudent.maxDevices || 1} &bull; Approved: {drawerApproved.length}
                </p>
              </div>
              <button
                onClick={() => setDevicesDrawerStudent(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex items-center border-b border-slate-200 px-5 pt-3 gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setDrawerTab("approved")}
                className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  drawerTab === "approved"
                    ? "border-emerald-600 text-emerald-800"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Approved ({drawerApproved.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("pending")}
                className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  drawerTab === "pending"
                    ? "border-amber-600 text-amber-800"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Pending ({drawerPending.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("rejected")}
                className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  drawerTab === "rejected"
                    ? "border-rose-600 text-rose-800"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Rejected ({drawerRejected.length})
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              {devicesLoading ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-500 mb-2" />
                  Loading devices...
                </div>
              ) : drawerTab === "approved" && drawerApproved.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  <Smartphone className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  No approved devices yet. Student&apos;s first login will automatically register their device.
                </div>
              ) : drawerTab === "pending" && drawerPending.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  <Check className="w-10 h-10 mx-auto text-emerald-300 mb-2" />
                  No pending device requests for this student.
                </div>
              ) : drawerTab === "rejected" && drawerRejected.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  No declined devices on record for this student.
                </div>
              ) : (
                (drawerTab === "approved"
                  ? drawerApproved
                  : drawerTab === "pending"
                  ? drawerPending
                  : drawerRejected
                ).map((d) => {
                  const label = d.deviceLabel || d.label || "Device";
                  const isTablet = d.deviceType === "tablet" || d.osFamily?.toLowerCase().includes("ipad");
                  const isMobile = d.deviceType === "mobile" || d.osFamily?.toLowerCase().includes("android") || d.osFamily?.toLowerCase().includes("ios");
                  const screen = d.profile?.screenMajor && d.profile?.screenMinor
                    ? `${d.profile.screenMajor}x${d.profile.screenMinor}`
                    : "Standard";
                  const loc = [d.city, d.region, d.country].filter(Boolean).join(", ") || "Unknown";
                  const hasActiveSession = drawerActiveSessionDeviceIds.includes(d.deviceId);

                  return (
                    <div
                      key={d._id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs text-slate-600"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                          {isTablet ? (
                            <Tablet className="w-4 h-4 text-emerald-600" />
                          ) : isMobile ? (
                            <Smartphone className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Laptop className="w-4 h-4 text-emerald-600" />
                          )}
                          <span>{label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {hasActiveSession && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                              Active Session
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              d.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : d.status === "pending"
                                ? "bg-amber-100 text-amber-800 animate-pulse"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {d.status?.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200/80">
                        <div>
                          <strong>OS:</strong> {d.osFamily || d.os || "—"} {d.osVersion}
                        </div>
                        <div>
                          <strong>Type:</strong> {d.deviceType || "desktop"}
                        </div>
                        <div>
                          <strong>Browser:</strong> {d.browserName || d.browser || "—"}
                        </div>
                        <div>
                          <strong>Model:</strong> {d.model || "—"}
                        </div>
                        <div>
                          <strong>Screen:</strong> {screen}
                        </div>
                        <div>
                          <strong>Attempts:</strong> {d.loginAttempts || d.attemptCount || 1}
                        </div>
                        <div className="col-span-2">
                          <strong>Browsers Seen:</strong>{" "}
                          {Array.isArray(d.browsersSeen) && d.browsersSeen.length > 0
                            ? d.browsersSeen.join(", ")
                            : d.browserName || d.browser || "Browser"}
                        </div>
                        {Array.isArray(d.aliases) && d.aliases.length > 0 && (
                          <div className="col-span-2 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                            <strong>Approved Aliases ({d.aliases.length}):</strong>
                            <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                              {d.aliases.map((al, alIdx) => (
                                <li key={alIdx}>
                                  Alias: {al.model || "Browser"} ({al.screenMajor}x{al.screenMinor}) &bull; Added: {al.addedAt ? new Date(al.addedAt).toLocaleDateString() : "—"}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="col-span-2">
                          <strong>IP:</strong> First: {d.firstIp || d.ip || "—"} &bull; Last: {d.lastIp || d.ip || "—"}
                        </div>
                        <div className="col-span-2">
                          <strong>Approx. Location:</strong> {loc}
                        </div>
                        <div className="col-span-2 text-[10px] text-slate-400 pt-0.5 border-t border-slate-100">
                          First: {d.firstLoginAt ? new Date(d.firstLoginAt).toLocaleString() : "—"} &bull; Last used:{" "}
                          {d.lastUsedAt ? new Date(d.lastUsedAt).toLocaleString() : "—"}
                        </div>
                      </div>

                      {/* Action buttons inside drawer */}
                      <div className="pt-1 flex items-center justify-end gap-2">
                        {d.status === "approved" && (
                          <button
                            type="button"
                            onClick={() => handleRevokeDevice(d.deviceId)}
                            className="px-3 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Revoke Device
                          </button>
                        )}

                        {d.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveFromDrawer(d._id, "additional")}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg"
                            >
                              Approve
                            </button>
                            {drawerApproved.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleApproveFromDrawer(d._id, "replace", drawerApproved[0]?.deviceId)}
                                className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg"
                              >
                                Replace
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const note = prompt("Optional reason for declining:");
                                handleRejectFromDrawer(d._id, note || "");
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {d.status === "rejected" && (
                          <button
                            type="button"
                            onClick={() => handleReconsiderFromDrawer(d._id)}
                            className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reconsider
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

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
    </div>
  );
}
