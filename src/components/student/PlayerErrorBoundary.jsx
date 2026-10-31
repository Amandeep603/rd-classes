"use client";

import React, { Component } from "react";
import { AlertCircle, RefreshCw, MessageCircle } from "lucide-react";

/**
 * PlayerErrorBoundary catches any rendering or lifecycle errors from VimeoPlayer
 * or its subcomponents. It guarantees the host page NEVER crashes into the Next.js
 * global error page, and displays a friendly in-modal recovery UI with Retry and WhatsApp.
 */
export default class PlayerErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCode: "E:playback",
    };
  }

  static getDerivedStateFromError(error) {
    const msg = error?.message || "";
    let errorCode = "E:playback";
    if (msg.includes("network") || msg.includes("fetch")) errorCode = "E:network";
    else if (msg.includes("403") || msg.includes("privacy")) errorCode = "E:privacy";
    else if (msg.includes("404") || msg.includes("not found")) errorCode = "E:notfound";

    return {
      hasError: true,
      error,
      errorCode,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[PlayerErrorBoundary caught error]:", error, errorInfo);

    // Send rate-limited error log to existing server endpoint
    try {
      if (typeof window !== "undefined") {
        fetch("/api/video-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: this.state.errorCode,
            errorName: String(error?.name || "PlayerError").slice(0, 80),
            errorMessage: String(error?.message || "Render exception").slice(0, 200),
            lectureId: this.props.lectureId || "",
          }),
        }).catch(() => {});
      }
    } catch {}
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorCode: "E:playback" });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      const { whatsappNumber = "918368545620", lectureTitle = "Class 12 Accountancy" } = this.props;
      const cleanPhone = String(whatsappNumber).replace(/\D/g, "");

      return (
        <div
          role="alert"
          className="relative w-full aspect-video bg-[#071D36] rounded-[22px] overflow-hidden flex flex-col items-center justify-center p-6 text-center text-white border border-white/10 select-none shadow-2xl"
        >
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>

          <h4 className="text-base font-bold text-white tracking-tight">Playback Interrupted</h4>
          <p className="mt-1 text-xs text-white/70 max-w-sm">
            Something unexpected occurred while loading this video. Please retry or contact our support team.
          </p>
          <span className="mt-1 text-[10px] font-mono text-white/40">
            Error Code: {this.state.errorCode}
          </span>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="flex items-center gap-2 h-9 px-4 rounded-full bg-[#FFC93C] hover:bg-[#FFB800] text-[#0B2A4A] font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>

            <a
              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                `Hello Sir, I encountered an issue watching "${lectureTitle}" (Code: ${this.state.errorCode}). Please help me access this lecture.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 h-9 px-4 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>Contact on WhatsApp</span>
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

