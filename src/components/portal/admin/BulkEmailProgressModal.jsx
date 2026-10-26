"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mail,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  X,
  Download,
  Copy,
  Check,
  ShieldAlert,
} from "lucide-react";
import {
  checkEmailConfigAction,
  sendBulkImportCredentialsChunkAction,
  bulkResetAndEmailCredentialsChunkAction,
} from "@/server/actions/admin.students.actions.js";

/**
 * BulkEmailProgressModal handles client-driven chunked email delivery.
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {"import" | "reset"} mode - "import" sends newly generated credentials; "reset" resets and emails
 * @param {Array} items - If import: [{ studentId, name, email, loginId, password }]; If reset: [{ _id, name, email, loginId }]
 * @param {() => void} onCompleted - Callback after batch completes
 */
export default function BulkEmailProgressModal({
  isOpen,
  onClose,
  mode = "reset",
  items = [],
  onCompleted,
}) {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [revokeSessions, setRevokeSessions] = useState(true);
  const [autoResetMissing, setAutoResetMissing] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Runner state: "idle" | "running" | "paused" | "finished" | "cancelled"
  const [runnerState, setRunnerState] = useState("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processedResults, setProcessedResults] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);
  const batchIdRef = useRef("");

  const handleClose = () => {
    setRunnerState("idle");
    setCurrentIndex(0);
    setProcessedResults([]);
    setConfirmText("");
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    checkEmailConfigAction().then((cfg) => {
      if (active) {
        setConfig(cfg);
        setLoadingConfig(false);
      }
    });

    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalItems = items.length;
  const itemsWithEmail = items.filter((i) => i.email && i.email.trim());
  const itemsWithoutEmail = items.filter((i) => !i.email || !i.email.trim());

  const requiresConfirmation = mode === "reset" && itemsWithEmail.length > 20;
  const isConfirmValid = !requiresConfirmation || confirmText.trim().toUpperCase() === "RESET";

  // Progress metrics
  const sentCount = processedResults.filter((r) => r.status === "sent").length;
  const failedCount = processedResults.filter((r) => r.status === "failed").length;
  const skippedCount = processedResults.filter((r) => r.status === "skipped").length + (itemsWithoutEmail.length);
  const percent = totalItems > 0 ? Math.round((currentIndex / totalItems) * 100) : 0;

  const startBatch = async (retryFailedOnly = false) => {
    isPausedRef.current = false;
    isCancelledRef.current = false;
    batchIdRef.current = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setRunnerState("running");

    let queue = retryFailedOnly
      ? processedResults.filter((r) => r.status === "failed").map((f) => {
          return items.find((i) => (i.studentId || i._id) === f.studentId) || f;
        })
      : [...items];

    if (!retryFailedOnly) {
      setProcessedResults([]);
      setCurrentIndex(0);
    }

    const chunkSize = 10;
    let idx = 0;

    while (idx < queue.length) {
      if (isCancelledRef.current) {
        setRunnerState("cancelled");
        break;
      }

      while (isPausedRef.current) {
        await new Promise((res) => setTimeout(res, 500));
        if (isCancelledRef.current) break;
      }

      if (isCancelledRef.current) {
        setRunnerState("cancelled");
        break;
      }

      const chunk = queue.slice(idx, idx + chunkSize);

      let chunkRes;
      if (mode === "import") {
        chunkRes = await sendBulkImportCredentialsChunkAction({
          items: chunk.map((c) => ({
            studentId: c.studentId || c._id,
            name: c.name,
            email: c.email,
            loginId: c.loginId,
            password: c.password || c.rawPassword,
          })),
          batchId: batchIdRef.current,
        });
      } else {
        chunkRes = await bulkResetAndEmailCredentialsChunkAction({
          studentIds: chunk.map((c) => c.studentId || c._id),
          revokeSessions,
          batchId: batchIdRef.current,
          autoResetMissing,
        });
      }

      if (!chunkRes || !chunkRes.success) {
        // Chunk failed completely (e.g. quota exhausted or error)
        const errDesc = chunkRes?.error || "Connection or action error";
        const fallbackResults = chunk.map((c) => ({
          studentId: c.studentId || c._id,
          name: c.name,
          email: c.email,
          status: "failed",
          error: errDesc,
        }));
        setProcessedResults((prev) => [...prev, ...fallbackResults]);
        idx += chunk.length;
        setCurrentIndex(idx);
        if (chunkRes?.quotaExhausted) {
          setRunnerState("finished");
          break;
        }
      } else {
        setProcessedResults((prev) => {
          // Replace or append
          const existingMap = new Map(prev.map((p) => [p.studentId, p]));
          chunkRes.results.forEach((r) => existingMap.set(r.studentId, r));
          return Array.from(existingMap.values());
        });
        idx += chunk.length;
        setCurrentIndex(idx);
      }

      // Small delay between chunks to prevent server overload
      if (idx < queue.length) {
        await new Promise((res) => setTimeout(res, 1000));
      }
    }

    if (!isCancelledRef.current) {
      setRunnerState("finished");
      if (onCompleted) onCompleted();
    }
  };

  const handlePauseToggle = () => {
    if (runnerState === "running") {
      isPausedRef.current = true;
      setRunnerState("paused");
    } else if (runnerState === "paused") {
      isPausedRef.current = false;
      setRunnerState("running");
    }
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    isPausedRef.current = false;
    setRunnerState("cancelled");
  };

  const downloadNewCredentialsCSV = () => {
    const rows = [["Name", "Login ID", "New Password", "Email", "Status"]];
    processedResults.forEach((r) => {
      rows.push([
        `"${(r.name || "").replace(/"/g, '""')}"`,
        `"${(r.loginId || "").replace(/"/g, '""')}"`,
        `"${(r.newPassword || "").replace(/"/g, '""')}"`,
        `"${(r.email || "").replace(/"/g, '""')}"`,
        r.status,
      ]);
    });
    const csvContent = rows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rd_reset_credentials_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-black/10 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 px-6 py-4 bg-neutral-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-900 shadow-2xs">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-neutral-900">
                {mode === "import"
                  ? "Email Credentials to Imported Students"
                  : "Bulk Send Student Credentials"}
              </h2>
              <p className="text-xs text-neutral-500">
                {totalItems} students selected • Chunked delivery
              </p>
            </div>
          </div>
          {runnerState !== "running" && (
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loadingConfig ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-neutral-400">
              <Loader2 className="h-8 w-8 animate-spin text-[#FFC21A]" />
              <p className="text-sm">Checking email delivery quota...</p>
            </div>
          ) : !config?.isConfigured ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span>Email Delivery Not Configured</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Outbound email is not active in this environment. Set up SMTP or Resend credentials in Settings to enable automated credential delivery.
              </p>
            </div>
          ) : (
            <>
              {/* Daily Quota Pill Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-neutral-50 border border-neutral-200/80 px-4 py-2.5 text-xs text-neutral-700">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    Driver: <strong className="uppercase font-mono">{config.driver}</strong>
                  </span>
                </div>
                <div>
                  Daily Quota Remaining:{" "}
                  <strong className={config.remaining > 20 ? "text-emerald-700 font-mono" : "text-amber-700 font-mono"}>
                    {config.remaining} / {config.dailyLimit}
                  </strong>
                </div>
              </div>

              {/* IDLE STATE: Configuration & Warnings */}
              {runnerState === "idle" && (
                <div className="space-y-4">
                  {mode === "reset" && (
                    <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-950 space-y-2.5">
                      <div className="flex items-center gap-2 font-bold text-sm text-sky-900">
                        <ShieldAlert className="h-4 w-4 text-sky-700" />
                        <span>Credential Delivery Notice</span>
                      </div>
                      <p className="leading-relaxed">
                        Credentials will be sent to students using their stored encrypted password <strong>without resetting</strong>.
                      </p>
                      <label className="flex items-center gap-2 pt-1 font-semibold cursor-pointer text-neutral-800">
                        <input
                          type="checkbox"
                          checked={autoResetMissing}
                          onChange={(e) => setAutoResetMissing(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span>Generate new password if encrypted copy is missing</span>
                      </label>
                      {autoResetMissing && (
                        <label className="flex items-center gap-2 pt-0.5 font-semibold cursor-pointer text-amber-900">
                          <input
                            type="checkbox"
                            checked={revokeSessions}
                            onChange={(e) => setRevokeSessions(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span>Revoke active logins / sessions when generating new passwords</span>
                        </label>
                      )}
                    </div>
                  )}

                  {itemsWithoutEmail.length > 0 && (
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5 text-xs text-neutral-600">
                      <strong>Notice:</strong> {itemsWithoutEmail.length} student(s) do not have an email address and will be skipped.
                    </div>
                  )}

                  {requiresConfirmation && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-2 text-xs text-red-950">
                      <p className="font-bold text-red-900">
                        High Impact: You are resetting passwords for {itemsWithEmail.length} students.
                      </p>
                      <p>Type <strong>RESET</strong> in capital letters below to confirm:</p>
                      <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Type RESET to confirm"
                        className="w-full rounded-xl border border-red-300 bg-white px-3 py-2 text-sm font-mono uppercase text-red-900 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* RUNNING / PAUSED / FINISHED: Progress Display */}
              {runnerState !== "idle" && (
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-neutral-700">
                      <span>Progress: {currentIndex} / {totalItems}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-neutral-100 overflow-hidden border border-black/5">
                      <div
                        className="h-full bg-[#FFC21A] transition-all duration-300 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Badges */}
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 py-2">
                      <div className="text-lg font-black text-emerald-800">{sentCount}</div>
                      <div className="text-[11px] font-bold text-emerald-700">Sent</div>
                    </div>
                    <div className="rounded-xl border border-red-200 bg-red-50 py-2">
                      <div className="text-lg font-black text-red-800">{failedCount}</div>
                      <div className="text-[11px] font-bold text-red-700">Failed</div>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 py-2">
                      <div className="text-lg font-black text-neutral-800">{skippedCount}</div>
                      <div className="text-[11px] font-bold text-neutral-600">Skipped</div>
                    </div>
                  </div>

                  {/* Real-time Row Status List */}
                  <div className="rounded-2xl border border-black/5 bg-neutral-50/70 p-3 max-h-56 overflow-y-auto space-y-1.5 text-xs">
                    {items.map((item) => {
                      const id = item.studentId || item._id;
                      const res = processedResults.find((r) => r.studentId === id);
                      const isNoEmail = !item.email || !item.email.trim();

                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 border border-black/5"
                        >
                          <div className="truncate">
                            <span className="font-bold text-neutral-900">{item.name}</span>
                            <span className="ml-2 font-mono text-[11px] text-neutral-400">
                              {item.loginId || id}
                            </span>
                          </div>
                          <div>
                            {isNoEmail ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-400">
                                Skipped (No email)
                              </span>
                            ) : !res ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                                Queued
                              </span>
                            ) : res.status === "sent" ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Sent</span>
                              </span>
                            ) : res.status === "failed" ? (
                              <span
                                className="inline-flex items-center gap-1 font-bold text-red-700"
                                title={res.error || "Failed"}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Failed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-neutral-500">
                                {res.status}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* If mode === 'reset' and finished, display generated credentials table */}
                  {runnerState === "finished" && mode === "reset" && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-800">
                          Newly Generated Passwords (Shown Once):
                        </span>
                        <button
                          type="button"
                          onClick={downloadNewCredentialsCSV}
                          className="inline-flex items-center gap-1 text-xs font-bold text-neutral-900 hover:text-amber-600 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download CSV</span>
                        </button>
                      </div>
                      <div className="rounded-xl border border-black/5 overflow-hidden max-h-40 overflow-y-auto text-xs bg-white">
                        <table className="w-full text-left">
                          <thead className="bg-neutral-50 text-[10px] uppercase font-bold text-neutral-500 border-b border-black/5">
                            <tr>
                              <th className="px-3 py-1.5">Student</th>
                              <th className="px-3 py-1.5">Login ID</th>
                              <th className="px-3 py-1.5">New Password</th>
                              <th className="px-3 py-1.5 text-right">Copy</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/5 font-mono text-[11px]">
                            {processedResults.map((r) => (
                              <tr key={r.studentId} className="hover:bg-neutral-50">
                                <td className="px-3 py-1.5 font-sans font-bold text-neutral-900">
                                  {r.name}
                                </td>
                                <td className="px-3 py-1.5 text-neutral-600">{r.loginId}</td>
                                <td className="px-3 py-1.5 font-bold text-neutral-900">
                                  {r.newPassword || "—"}
                                </td>
                                <td className="px-3 py-1.5 text-right">
                                  {r.newPassword && (
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(r.newPassword, r.studentId)}
                                      className="text-neutral-400 hover:text-neutral-900"
                                    >
                                      {copiedId === r.studentId ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-black/5 bg-neutral-50/80 px-6 py-4">
          {runnerState === "idle" ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!config?.isConfigured || !isConfirmValid || itemsWithEmail.length === 0}
                onClick={() => startBatch(false)}
                className="flex items-center gap-2 rounded-xl bg-[#FFC21A] px-5 py-2.5 text-xs font-extrabold text-neutral-950 shadow-[0_2px_8px_rgba(255,194,26,0.35)] hover:bg-[#ffd54a] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Mail className="h-4 w-4 stroke-[2.5]" />
                <span>
                  Start Emailing {itemsWithEmail.length} Student{itemsWithEmail.length === 1 ? "" : "s"}
                </span>
              </button>
            </>
          ) : runnerState === "running" ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                Cancel Remaining
              </button>
              <button
                type="button"
                onClick={handlePauseToggle}
                className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
              >
                <Pause className="h-3.5 w-3.5" />
                <span>Pause</span>
              </button>
            </>
          ) : runnerState === "paused" ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                Cancel Remaining
              </button>
              <button
                type="button"
                onClick={handlePauseToggle}
                className="flex items-center gap-1.5 rounded-xl bg-[#FFC21A] px-4 py-2 text-xs font-extrabold text-neutral-950 shadow-2xs hover:bg-[#ffd54a] transition-colors cursor-pointer"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Resume</span>
              </button>
            </>
          ) : (
            // finished or cancelled
            <>
              <div>
                {failedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => startBatch(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Retry Failed ({failedCount})</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl bg-neutral-900 px-5 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Done / Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
