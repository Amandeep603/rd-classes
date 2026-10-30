"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play } from "lucide-react";
import Watermark from "./Watermark";
import { buildVimeoEmbedUrl } from "@/lib/utils/vimeoParser";

export default function VimeoPlayer({
  playerUrl: initialPlayerUrl,
  vimeoId,
  vimeoHash,
  lectureId,
  savedPositionSec = 0,
  durationSeconds = 0,
  studentName: initialStudentName,
  loginId: initialLoginId,
  studentPhone: initialStudentPhone,
  watermarkText,
  isFreePreview = false,
  enableProgress = true,
  onComplete,
  autoPlay = false,
}) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [resolvedPlayerUrl, setResolvedPlayerUrl] = useState(initialPlayerUrl || "");
  const [studentMeta, setStudentMeta] = useState({
    name: initialStudentName || "",
    loginId: initialLoginId || "",
    phone: initialStudentPhone || "",
  });
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [playError, setPlayError] = useState("");

  const wrapperRef = useRef(null);
  const iframeRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const lastSavedSecRef = useRef(savedPositionSec);
  const hasSyncedDurationRef = useRef(false);

  const effectiveEmbedUrl =
    resolvedPlayerUrl ||
    (vimeoId ? buildVimeoEmbedUrl(vimeoId, vimeoHash) : "");

  // Fetch player embed URL dynamically if not supplied upfront
  const handleStartPlayback = async () => {
    setPlayError("");
    if (effectiveEmbedUrl) {
      setIsPlaying(true);
      return;
    }

    if (!lectureId) {
      setPlayError("Lecture not available.");
      return;
    }

    setLoadingUrl(true);
    try {
      const res = await fetch(`/api/student/watch/${lectureId}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();

      if (!res.ok) {
        setPlayError(data.error || "Unable to play lecture.");
        return;
      }

      if (data?.data?.playerUrl) {
        setResolvedPlayerUrl(data.data.playerUrl);
      } else if (data?.data?.vimeoId) {
        setResolvedPlayerUrl(buildVimeoEmbedUrl(data.data.vimeoId, data.data.vimeoHash));
      }

      if (data?.data?.student) {
        setStudentMeta({
          name: data.data.student.name || "",
          loginId: data.data.student.loginId || "",
          phone: data.data.student.phone || "",
        });
      }

      setIsPlaying(true);
    } catch {
      setPlayError("Network error. Please try again.");
    } finally {
      setLoadingUrl(false);
    }
  };

  // Progress Beacon / Keepalive save helper
  const sendProgressSave = useCallback(
    (pos, dur, completed = false, isUnload = false) => {
      if (!enableProgress || !lectureId) return;
      const wSec = Math.floor(pos);
      const dSec = Math.floor(dur);
      const isComp = completed || (dSec > 0 && wSec >= dSec * 0.9);

      lastSavedSecRef.current = wSec;

      const payload = JSON.stringify({
        watchedSeconds: wSec,
        durationSeconds: dSec,
        completed: isComp,
      });

      if (isUnload && typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(
          `/api/student/lectures/${lectureId}/progress`,
          new Blob([payload], { type: "application/json" })
        );
      } else {
        fetch(`/api/student/lectures/${lectureId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }

      if (isComp) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("rd:lecture_completed", { detail: { lectureId } })
          );
        }
        if (onComplete) {
          onComplete();
        }
      }
    },
    [enableProgress, lectureId, onComplete]
  );

  // Toggle Play / Pause when clicking the shield layer
  const handleShieldClick = () => {
    if (!playerInstanceRef.current) return;
    playerInstanceRef.current
      .getPaused()
      .then((paused) => {
        if (paused) {
          playerInstanceRef.current.play().catch(() => {});
        } else {
          playerInstanceRef.current.pause().catch(() => {});
        }
      })
      .catch(() => {});
  };

  // Double click on shield to toggle fullscreen on the wrapper
  const handleShieldDoubleClick = () => {
    if (!wrapperRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      wrapperRef.current.requestFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    if (!isPlaying || !effectiveEmbedUrl) return;

    let player = null;
    let isCancelled = false;

    async function initVimeo() {
      if (!iframeRef.current) return;
      try {
        const { default: Vimeo } = await import("@vimeo/player");
        if (isCancelled || !iframeRef.current) return;

        player = new Vimeo(iframeRef.current);
        playerInstanceRef.current = player;

        // Sync duration on first play if 0
        if (!hasSyncedDurationRef.current) {
          player
            .getDuration()
            .then((realDur) => {
              if (realDur > 0 && (!durationSeconds || durationSeconds === 0)) {
                hasSyncedDurationRef.current = true;
                sendProgressSave(savedPositionSec, realDur, false);
              }
            })
            .catch(() => {});
        }

        // Resume playback from saved position
        if (savedPositionSec > 2) {
          player.setCurrentTime(savedPositionSec).catch(() => {});
        }

        // Periodic 10-second progress save
        let lastInterval = 0;
        player.on("timeupdate", (data) => {
          const now = Date.now();
          if (now - lastInterval >= 10000) {
            lastInterval = now;
            sendProgressSave(data.seconds, data.duration, false);
          }
        });

        player.on("pause", (data) => {
          sendProgressSave(data.seconds, data.duration, false);
        });

        player.on("ended", (data) => {
          sendProgressSave(data.duration, data.duration, true);
        });

        const handlePageHide = () => {
          if (playerInstanceRef.current) {
            playerInstanceRef.current
              .getCurrentTime()
              .then((sec) => {
                playerInstanceRef.current.getDuration().then((dur) => {
                  sendProgressSave(sec, dur, false, true);
                });
              })
              .catch(() => {});
          }
        };

        const handleVisibilityChange = () => {
          if (document.visibilityState === "hidden" && playerInstanceRef.current) {
            playerInstanceRef.current
              .getCurrentTime()
              .then((sec) => {
                playerInstanceRef.current.getDuration().then((dur) => {
                  sendProgressSave(sec, dur, false);
                });
              })
              .catch(() => {});
          }
        };

        window.addEventListener("pagehide", handlePageHide);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
          window.removeEventListener("pagehide", handlePageHide);
          document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
      } catch (err) {
        console.error("Vimeo SDK initialization error:", err);
      }
    }

    initVimeo();

    return () => {
      isCancelled = true;
      if (player) {
        player.destroy().catch(() => {});
      }
    };
  }, [isPlaying, effectiveEmbedUrl, savedPositionSec, durationSeconds, sendProgressSave]);

  return (
    <>
      {/* Preconnect for low-latency Vimeo iframe loading */}
      <link rel="preconnect" href="https://player.vimeo.com" />
      <link rel="preconnect" href="https://i.vimeocdn.com" />

      <div
        ref={wrapperRef}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="relative w-full aspect-video bg-[#0A0A0C] rounded-[22px] overflow-hidden shadow-2xl border border-black/10 select-none"
      >
        {!isPlaying ? (
          /* Thumbnail Facade with Play Button */
          <div
            onClick={handleStartPlayback}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-radial from-[#1A233A] to-[#0A0D18] cursor-pointer group transition-all"
          >
            {/* Glowing yellow play button */}
            <div className="w-20 h-20 rounded-full bg-[#FFC93C] group-hover:bg-[#FDB813] flex items-center justify-center shadow-[0_0_30px_rgba(255,201,60,0.5)] group-hover:scale-105 transition-all active:scale-95">
              <Play className="w-8 h-8 fill-[#0B2A4A] text-[#0B2A4A] ml-1" />
            </div>
            <p className="mt-4 text-xs font-bold text-white/80 group-hover:text-white tracking-wide uppercase">
              {loadingUrl ? "Loading secure player..." : "Click to Play Lecture"}
            </p>
            {playError && (
              <p className="mt-2 text-xs font-semibold text-rose-400">
                {playError}
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Single Vimeo Iframe */}
            <iframe
              ref={iframeRef}
              src={effectiveEmbedUrl}
              allow="autoplay; fullscreen"
              allowFullScreen
              className="w-full h-full border-0 absolute inset-0 z-10"
              title="RD Classes Lecture Video"
            />

            {/* Transparent Shield Layer: Covers top area down to bottom 56px strip
                Intercepts right-clicks, drag, and prevents Vimeo context menu */}
            <div
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDragStart={(e) => e.preventDefault()}
              onClick={handleShieldClick}
              onDoubleClick={handleShieldDoubleClick}
              className="absolute inset-x-0 top-0 bottom-[56px] z-20 cursor-pointer bg-transparent"
              aria-label="Video playback area"
            />
          </>
        )}

        {/* Dynamic Watermark positioned inside wrapper (persists in fullscreen) */}
        <Watermark
          studentName={studentMeta.name}
          loginId={studentMeta.loginId}
          phone={studentMeta.phone}
          text={watermarkText}
          isFreePreview={isFreePreview}
        />
      </div>
    </>
  );
}
