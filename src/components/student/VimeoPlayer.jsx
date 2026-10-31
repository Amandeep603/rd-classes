"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import Image from "next/image";
import { Loader2, RefreshCw, AlertCircle, WifiOff } from "lucide-react";
import Watermark from "./Watermark";

/**
 * Maps raw Vimeo SDK error to friendly code & message.
 * Never exposes vimeoId or hash.
 */
function mapVimeoError(err) {
  const name = err?.name || "";
  const msg = (err?.message || "").toLowerCase();

  if (name === "PrivacyError" || msg.includes("privacy") || msg.includes("permission") || msg.includes("domain")) {
    return {
      code: "E:privacy",
      message: "This video has domain privacy restrictions. Please contact RD Classes support.",
    };
  }
  if (name === "NotFoundError" || msg.includes("not found")) {
    return {
      code: "E:notfound",
      message: "Video lecture not found or has been moved.",
    };
  }
  if (name === "TypeError" || msg.includes("network") || msg.includes("offline") || msg.includes("failed to fetch")) {
    return {
      code: "E:network",
      message: "Network error loading video. Please check your internet connection.",
    };
  }
  return {
    code: "E:playback",
    message: "Unable to play video lecture at this time. Click retry to try again.",
  };
}

function VimeoPlayer({
  lectureId,
  playerUrl: initialPlayerUrl,
  savedPositionSec = 0,
  durationSeconds = 0,
  studentName,
  loginId,
  studentPhone,
  watermarkText,
  isFreePreview = false,
  enableProgress = true,
  autoPlay = false,
  onComplete,
  onLoaded,
  isWarmedUp = false,
  className = "",
}) {
  // Stable embed URL (cached once per lectureId)
  const [embedUrl, setEmbedUrl] = useState(initialPlayerUrl || "");
  console.log("[VimeoPlayer RENDER] embedUrl:", Boolean(embedUrl), "lectureId:", lectureId);
  const [studentMeta, setStudentMeta] = useState({
    name: studentName || "",
    loginId: loginId || "",
    phone: studentPhone || "",
  });

  // UI state
  const [posterFaded, setPosterFaded] = useState(false);
  const [posterTakingLong, setPosterTakingLong] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [sdkError, setSdkError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // Debug overlay (?debugplayer=1)
  const [showDebug, setShowDebug] = useState(false);
  const [debugEvents, setDebugEvents] = useState([]);
  const [debugStats, setDebugStats] = useState({
    timeToFirstPlayMs: null,
    posterRemovedBy: null,
  });

  // Refs for zero-render stability
  const wrapperRef = useRef(null);
  const iframeRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const lastSavedTimeRef = useRef(savedPositionSec);
  const seekingRef = useRef(false);
  const seekTargetRef = useRef(0);
  const seekTimeoutRef = useRef(null);
  const posterTimeoutRef = useRef(null);
  const loadTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const mountTimeRef = useRef(Date.now());
  const firstPlayLoggedRef = useRef(false);
  const destroyedRef = useRef(false);
  const eventsLogRef = useRef([]);

  // Log debug event helper
  const addDebugEvent = useCallback((event, details = "") => {
    const entry = {
      event,
      details: String(details).replace(/\d{6,}/g, "[ID]"),
      time: Math.round(performance.now()),
    };
    eventsLogRef.current = [entry, ...eventsLogRef.current.slice(0, 14)];
    setDebugEvents([...eventsLogRef.current]);
  }, []);

  // Initialize debug state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("debugplayer") === "1") {
        setShowDebug(true);
      }
    }
  }, []);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      addDebugEvent("online");
      // Auto-recover playback if stalled
      if (playerInstanceRef.current && !destroyedRef.current) {
        playerInstanceRef.current.play().catch(() => {});
      }
    };
    const handleOffline = () => {
      setIsOffline(true);
      addDebugEvent("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [addDebugEvent]);

  // Fetch player URL dynamically if not provided upfront
  useEffect(() => {
    if (!lectureId) return;

    let isMounted = true;
    const fetchPlayerUrl = async () => {
      try {
        const res = await fetch(`/api/student/watch/${lectureId}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (isMounted) {
            setSdkError({
              code: res.status === 403 ? "E:privacy" : "E:notfound",
              message: errData.error || "Unable to load video lecture.",
            });
          }
          return;
        }
        const data = await res.json();
        if (!isMounted) return;

        if (data?.data?.playerUrl) {
          setEmbedUrl(data.data.playerUrl);
        }
        if (data?.data?.savedPositionSec) {
          lastSavedTimeRef.current = data.data.savedPositionSec;
        }
        if (data?.data?.student) {
          setStudentMeta({
            name: data.data.student.name || "",
            loginId: data.data.student.loginId || "",
            phone: data.data.student.phone || "",
          });
        }
      } catch (err) {
        if (isMounted) {
          setSdkError({
            code: "E:network",
            message: "Network error loading player. Please check your connection.",
          });
        }
      }
    };

    fetchPlayerUrl();
    return () => {
      isMounted = false;
    };
  }, [lectureId, retryKey]);

  // Progress beacon / save helper
  const saveProgress = useCallback(
    (currentTime, dur, isCompleted = false) => {
      if (!enableProgress || !lectureId || seekingRef.current) return;
      const wSec = Math.floor(currentTime);
      const dSec = Math.floor(dur);
      lastSavedTimeRef.current = wSec;

      const payload = {
        lectureId,
        watchedSeconds: wSec,
        durationSeconds: dSec,
        completed: isCompleted,
      };

      try {
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
          navigator.sendBeacon("/api/student/progress", blob);
        } else {
          fetch("/api/student/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            keepalive: true,
          }).catch(() => {});
        }
      } catch {}
    },
    [enableProgress, lectureId]
  );

  // Send rate-limited error log to server
  const reportErrorToServer = useCallback(
    (code, errorName, errorMessage) => {
      try {
        fetch("/api/video-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            errorName: String(errorName || "").slice(0, 80),
            errorMessage: String(errorMessage || "").slice(0, 200),
            lectureId,
          }),
        }).catch(() => {});
      } catch {}
    },
    [lectureId]
  );

  // Manual Retry Handler
  const handleRetry = useCallback(() => {
    setSdkError(null);
    setPosterFaded(false);
    setPosterTakingLong(false);
    setIsBuffering(false);
    setIsSeeking(false);
    setRetryKey((prev) => prev + 1);
    addDebugEvent("manual_retry");
  }, [addDebugEvent]);

  // Main Vimeo SDK Lifecycle Effect
  useEffect(() => {
    if (!embedUrl || !iframeRef.current) return;

    let isCancelled = false;
    destroyedRef.current = false;
    mountTimeRef.current = performance.now();
    addDebugEvent("player_init");

    // 8-Second Safety Timeout: ALWAYS fade poster after 8s so Vimeo's UI or error becomes visible
    posterTimeoutRef.current = setTimeout(() => {
      if (!isCancelled) {
        setPosterFaded(true);
        setPosterTakingLong(true);
        setDebugStats((prev) => ({
          ...prev,
          posterRemovedBy: prev.posterRemovedBy || "timeout8s",
        }));
        addDebugEvent("poster_timeout_8s");
      }
    }, 8000);

    // 10-Second Load Recovery Timeout (retries with backoff up to 3 times)
    loadTimeoutRef.current = setTimeout(() => {
      if (!isCancelled && !posterFaded && retryCountRef.current < 3) {
        retryCountRef.current++;
        const backoffMs = retryCountRef.current === 1 ? 2000 : 5000;
        addDebugEvent(`load_stalled_retry_${retryCountRef.current}`, `backoff ${backoffMs}ms`);
        setTimeout(() => {
          if (!isCancelled && !destroyedRef.current) {
            handleRetry();
          }
        }, backoffMs);
      }
    }, 10000);

    // Load Vimeo SDK dynamically only when player mounts
    let player = null;
    import("@vimeo/player")
      .then((mod) => {
        if (isCancelled || destroyedRef.current || !iframeRef.current) return;
        const PlayerClass = mod.default || mod;

        try {
          player = new PlayerClass(iframeRef.current);
          playerInstanceRef.current = player;
        } catch (err) {
          const mapped = mapVimeoError(err);
          setSdkError(mapped);
          reportErrorToServer(mapped.code, err.name, err.message);
          return;
        }

        // 1. SDK 'loaded' Event: Fade poster immediately
        player.on("loaded", () => {
          if (isCancelled) return;
          clearTimeout(posterTimeoutRef.current);
          clearTimeout(loadTimeoutRef.current);
          setPosterFaded(true);
          setPosterTakingLong(false);
          setDebugStats((prev) => ({
            ...prev,
            posterRemovedBy: prev.posterRemovedBy || "loaded",
          }));
          addDebugEvent("loaded");
          if (onLoaded) onLoaded();

          // Resume position if saved
          if (lastSavedTimeRef.current > 0) {
            player.setCurrentTime(lastSavedTimeRef.current).catch(() => {});
          }

          // Resource timing observer for *.vimeocdn.com
          try {
            if (typeof performance !== "undefined" && performance.getEntriesByType) {
              const resources = performance.getEntriesByType("resource");
              const cdnHost = resources.find((r) => r.name.includes("vimeocdn.com"));
              if (cdnHost) {
                const parsed = new URL(cdnHost.name);
                const existing = document.querySelector(`link[href="${parsed.origin}"]`);
                if (!existing) {
                  const link = document.createElement("link");
                  link.rel = "preconnect";
                  link.href = parsed.origin;
                  document.head.appendChild(link);
                }
              }
            }
          } catch {}
        });

        // 2. Playback Events
        player.on("play", () => {
          if (isCancelled) return;
          setIsBuffering(false);
          addDebugEvent("play");
        });

        player.on("playing", () => {
          if (isCancelled) return;
          setIsBuffering(false);
          setIsSeeking(false);
          addDebugEvent("playing");

          if (!firstPlayLoggedRef.current) {
            firstPlayLoggedRef.current = true;
            const elapsedSinceMount = Math.round(performance.now() - mountTimeRef.current);
            setDebugStats((prev) => ({ ...prev, timeToFirstPlayMs: elapsedSinceMount }));
            addDebugEvent("first_playing", `${elapsedSinceMount}ms`);
          }
        });

        player.on("pause", () => {
          if (isCancelled) return;
          addDebugEvent("pause");
          player.getCurrentTime().then((sec) => {
            player.getDuration().then((dur) => saveProgress(sec, dur, false));
          }).catch(() => {});
        });

        // 3. Spinner States: bufferstart & bufferend
        player.on("bufferstart", () => {
          if (isCancelled) return;
          setIsBuffering(true);
          addDebugEvent("bufferstart");
        });

        player.on("bufferend", () => {
          if (isCancelled) return;
          setIsBuffering(false);
          addDebugEvent("bufferend");
        });

        player.on("waiting", () => {
          if (isCancelled) return;
          setIsBuffering(true);
          addDebugEvent("waiting");
        });

        // 4. Seeking States & Recovery
        player.on("seeking", (data) => {
          if (isCancelled) return;
          seekingRef.current = true;
          seekTargetRef.current = data?.seconds || 0;
          setIsSeeking(true);
          addDebugEvent("seeking", `${Math.round(data?.seconds || 0)}s`);

          clearTimeout(seekTimeoutRef.current);
          // If seek stalls for 10s: retry setCurrentTime once
          seekTimeoutRef.current = setTimeout(() => {
            if (seekingRef.current && playerInstanceRef.current && !destroyedRef.current) {
              addDebugEvent("seek_retry_10s", `${seekTargetRef.current}s`);
              playerInstanceRef.current.setCurrentTime(seekTargetRef.current).catch(() => {});

              // If still stalled at 15s: recreate player once at that time
              seekTimeoutRef.current = setTimeout(() => {
                if (seekingRef.current && !destroyedRef.current) {
                  addDebugEvent("seek_recreate_15s", `${seekTargetRef.current}s`);
                  lastSavedTimeRef.current = seekTargetRef.current;
                  handleRetry();
                }
              }, 5000);
            }
          }, 10000);
        });

        player.on("seeked", (data) => {
          if (isCancelled) return;
          clearTimeout(seekTimeoutRef.current);
          seekingRef.current = false;
          setIsSeeking(false);
          setIsBuffering(false);
          addDebugEvent("seeked", `${Math.round(data?.seconds || 0)}s`);

          // Save progress only after seek completes
          player.getDuration().then((dur) => {
            saveProgress(data?.seconds || 0, dur, false);
          }).catch(() => {});
        });

        // 5. Completion
        player.on("ended", () => {
          if (isCancelled) return;
          addDebugEvent("ended");
          player.getDuration().then((dur) => {
            saveProgress(dur, dur, true);
          }).catch(() => {});
          if (onComplete) onComplete();
        });

        // 6. Error Handler
        player.on("error", (err) => {
          if (isCancelled) return;
          const mapped = mapVimeoError(err);
          setSdkError(mapped);
          setIsBuffering(false);
          setIsSeeking(false);
          addDebugEvent("error", `${mapped.code}: ${err.name}`);
          reportErrorToServer(mapped.code, err.name, err.message);
        });

        // Autoplay if requested
        if (autoPlay) {
          player.play().catch(() => {});
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          const mapped = mapVimeoError(err);
          setSdkError(mapped);
          reportErrorToServer(mapped.code, err.name, err.message);
        }
      });

    // Cleanup: StrictMode safe
    return () => {
      isCancelled = true;
      destroyedRef.current = true;
      clearTimeout(posterTimeoutRef.current);
      clearTimeout(loadTimeoutRef.current);
      clearTimeout(seekTimeoutRef.current);

      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy().catch(() => {});
        } catch {}
        playerInstanceRef.current = null;
      }
    };
  }, [
    embedUrl,
    autoPlay,
    retryKey,
    onLoaded,
    onComplete,
    saveProgress,
    reportErrorToServer,
    handleRetry,
    addDebugEvent,
  ]);

  // Handle autoPlay toggle (e.g. when modal opens)
  useEffect(() => {
    if (autoPlay && playerInstanceRef.current && !destroyedRef.current) {
      playerInstanceRef.current.play().catch(() => {});
    }
  }, [autoPlay]);

  return (
    <div
      ref={wrapperRef}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className={`relative w-full aspect-video bg-[#0B2A4A] rounded-[22px] overflow-hidden shadow-2xl border border-black/10 select-none ${className}`}
    >
      {/* 1. Vimeo Iframe: mounted once per lecture, allow with encrypted-media, NO duplicate allowfullscreen */}
      <iframe
        ref={iframeRef}
        key={`vimeo-ifr-${lectureId}-${retryKey}`}
        src={embedUrl || undefined}
        allow="autoplay; fullscreen; encrypted-media"
        className="w-full h-full border-0 absolute inset-0 z-10"
        title="RD Classes Lecture Video"
      />

      {/* 2. Branded Poster (fades out on 'loaded' OR strictly after 8s) */}
      <div
        className={`absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-br from-[#0B2A4A] via-[#071D36] to-[#041324] transition-opacity duration-700 pointer-events-none ${
          posterFaded ? "opacity-0 invisible" : "opacity-100 visible"
        }`}
        aria-hidden={posterFaded}
      >
        <div className="relative w-20 h-12 mb-3">
          <Image
            src="/images/logo-rd-light.png"
            alt="RD Classes"
            fill
            className="object-contain drop-shadow-md"
            priority
          />
        </div>
        <div className="flex items-center gap-2.5 text-white/90">
          <Loader2 className="w-5 h-5 text-[#FFC93C] animate-spin" />
          <span className="text-sm font-semibold tracking-wide">Loading video...</span>
        </div>
      </div>

      {/* 3. Non-blocking Banner if 'loaded' took > 8 seconds */}
      {posterTakingLong && !sdkError && (
        <div className="absolute top-3 inset-x-3 z-40 flex items-center justify-between gap-3 bg-[#0B2A4A]/90 backdrop-blur-md border border-amber-400/30 text-amber-100 px-4 py-2 rounded-xl text-xs shadow-lg animate-fade-in pointer-events-auto">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Taking longer than usual to load video...</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-[#FFC93C] hover:bg-[#FFB800] text-[#0B2A4A] font-bold text-xs rounded-full transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 4. Small Centered Spinner on bufferstart, seeking & waiting */}
      {(isBuffering || isSeeking) && posterFaded && !sdkError && (
        <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-[1px] transition-all">
          <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 shadow-2xl">
            <Loader2 className="w-7 h-7 text-[#FFC93C] animate-spin" />
            <span className="text-[11px] font-bold text-white/90 tracking-wider uppercase">
              {isSeeking ? "Seeking..." : "Buffering..."}
            </span>
          </div>
        </div>
      )}

      {/* 5. Offline Banner */}
      {isOffline && (
        <div className="absolute top-3 inset-x-3 z-40 flex items-center justify-between gap-3 bg-red-950/90 backdrop-blur-md border border-red-500/40 text-red-200 px-4 py-2 rounded-xl text-xs shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-red-400 shrink-0" />
            <span>You are offline. Video will resume automatically when reconnected.</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="shrink-0 px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Reconnect
          </button>
        </div>
      )}

      {/* 6. Friendly Error Screen */}
      {sdkError && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#071D36] text-white p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">Playback Interrupted</h4>
          <p className="mt-1 text-xs text-white/70 max-w-sm">{sdkError.message}</p>
          <span className="mt-1 text-[10px] font-mono text-white/40">Code: {sdkError.code}</span>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 flex items-center gap-2 h-9 px-4 rounded-full bg-[#FFC93C] hover:bg-[#FFB800] text-[#0B2A4A] font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Video</span>
          </button>
        </div>
      )}

      {/* 7. Step 3: Transparent Click-Blocking Shield
          Covers top-right button column and top 20% of video to block Vimeo Like/Share/Embed.
          Leaves bottom control strip (scrubber, play/pause, volume, fullscreen) completely interactive! */}
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="absolute top-0 right-0 w-36 h-36 z-20 pointer-events-auto bg-transparent"
        aria-hidden="true"
      />
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="absolute top-0 inset-x-0 h-[20%] z-20 pointer-events-auto bg-transparent"
        aria-hidden="true"
      />

      {/* 8. Dynamic Floating Watermark (Direct DOM positioning, zero React state re-renders) */}
      <Watermark
        studentName={studentMeta.name}
        loginId={studentMeta.loginId}
        phone={studentMeta.phone}
        text={watermarkText}
        isFreePreview={isFreePreview}
      />

      {/* 9. Hidden Debug Overlay (?debugplayer=1) */}
      {showDebug && (
        <div
          className="absolute bottom-2 left-2 z-50 bg-black/90 text-emerald-400 p-2.5 rounded-xl font-mono text-[10px] max-w-xs max-h-48 overflow-y-auto border border-emerald-500/30 backdrop-blur-md shadow-2xl pointer-events-auto"
          role="region"
          aria-label="Player Debug Overlay"
        >
          <div className="font-bold text-white border-b border-emerald-500/30 pb-1 mb-1 flex items-center justify-between">
            <span>PLAYER DEBUG</span>
            <span className="text-[9px] text-emerald-300">
              {debugStats.posterRemovedBy ? `Poster: ${debugStats.posterRemovedBy}` : "Loading"}
            </span>
          </div>
          <div>First play: {debugStats.timeToFirstPlayMs ? `${debugStats.timeToFirstPlayMs}ms` : "Waiting"}</div>
          <div className="mt-1 font-bold text-white/70">Recent Events:</div>
          <ul className="space-y-0.5 mt-0.5">
            {debugEvents.map((ev, i) => (
              <li key={i} className="truncate">
                <span className="text-white/50">{ev.time}ms:</span> {ev.event}{" "}
                {ev.details && <span className="text-emerald-300/80">({ev.details})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default memo(VimeoPlayer);
