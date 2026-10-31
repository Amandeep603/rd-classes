"use client";

import { useEffect, useRef, useState, useCallback, memo, Component } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Smartphone,
  SlidersHorizontal,
  X,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  WifiOff,
} from "lucide-react";
import Watermark from "./Watermark";

/**
 * MenuErrorBoundary catches any rendering error specifically within dropdown menus
 * (such as speed sheet or quality menu), ensuring a menu glitch never replaces the
 * player with a fatal error screen.
 */
class MenuErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.error("[MenuErrorBoundary caught error]:", error);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/**
 * Format seconds into mm:ss or hh:mm:ss
 */
function formatTime(seconds) {
  if (isNaN(seconds) || seconds === null || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Maps raw Vimeo SDK error to friendly code & message.
 * Never exposes vimeoId or hash.
 */
function mapVimeoError(err) {
  const name = err?.name || "";
  const msg = (err?.message || "").toLowerCase();

  // Transient / interrupt errors caused by rapid play/pause should be ignored
  if (
    name === "AbortError" ||
    name === "InterruptedError" ||
    name === "NotAllowedError" ||
    msg.includes("abort") ||
    msg.includes("interrupted") ||
    msg.includes("the play() request was interrupted") ||
    msg.includes("play request was interrupted")
  ) {
    return null;
  }

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
    code: "E:load",
    message: "Unable to load video lecture at this time. Click retry to try again.",
  };
}

const AVAILABLE_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function VimeoPlayer({
  lectureId,
  lectureTitle = "Class 12 Accountancy",
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
  nextLectureId,
  onNextLecture,
  onComplete,
  onLoaded,
  onClose,
  className = "",
}) {
  // Stable embed URL (cached once per lectureId)
  const [embedUrl, setEmbedUrl] = useState(initialPlayerUrl || "");
  const [studentMeta, setStudentMeta] = useState({
    name: studentName || "",
    loginId: loginId || "",
    phone: studentPhone || "",
  });

  // UI / Playback states
  const [posterFaded, setPosterFaded] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [sdkError, setSdkError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // Speed and quality controls
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isHolding2x, setIsHolding2x] = useState(false);
  const [showSpeedSheet, setShowSpeedSheet] = useState(false);
  const [qualities, setQualities] = useState([]); // [{ id: string, label: string }]
  const [selectedQuality, setSelectedQuality] = useState("auto");
  const [playingResolution, setPlayingResolution] = useState("");
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // In-player toast notification
  const [toast, setToast] = useState(null); // { message, actionLabel, onAction, id }
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, actionLabel = null, onAction = null, durationMs = 4000) => {
    clearTimeout(toastTimerRef.current);
    setToast({ message, actionLabel, onAction, id: Date.now() });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, durationMs);
  }, []);

  // Buffering tracker for slow connection nudge
  const bufferStartRef = useRef(null);
  const bufferSpansRef = useRef([]);
  const hasNudgedRef = useRef(false);

  // Audio & Fullscreen states
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCssFullscreen, setIsCssFullscreen] = useState(false);
  const [canOrientationLock, setCanOrientationLock] = useState(false);

  // Gesture ripple animation
  const [ripple, setRipple] = useState(null); // { side: "left"|"right"|"center", text: string, id: number }

  // Debug overlay (?debugplayer=1)
  const [showDebug, setShowDebug] = useState(false);
  const [debugEvents, setDebugEvents] = useState([]);
  const [debugStats, setDebugStats] = useState({
    timeToFirstPlayMs: null,
    posterRemovedBy: null,
  });

  // Refs for zero-render DOM manipulation & stable callbacks
  const wrapperRef = useRef(null);
  const iframeRef = useRef(null);
  const playerInstanceRef = useRef(null);

  // Scrubber & time DOM refs (Direct updates, zero React state re-render on ticks)
  const progressBarRef = useRef(null);
  const bufferedBarRef = useRef(null);
  const scrubberHandleRef = useRef(null);
  const currentTimeDisplayRef = useRef(null);
  const durationDisplayRef = useRef(null);
  const scrubberTrackRef = useRef(null);
  const scrubTooltipRef = useRef(null);

  // Tracking refs
  const durationRef = useRef(durationSeconds || 0);
  const currentTimeRef = useRef(savedPositionSec || 0);
  const lastSavedTimeRef = useRef(savedPositionSec || 0);
  const isDraggingScrubberRef = useRef(false);
  const previousRateRef = useRef(1);
  const controlsTimeoutRef = useRef(null);
  const doubleTapTimerRef = useRef(null);
  const lastTapTimeRef = useRef(0);
  const tapAccumulatorRef = useRef(0);
  const longPressTimerRef = useRef(null);
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

  // Log debug event helper (never logs raw Vimeo IDs or hashes)
  const addDebugEvent = useCallback((event, details = "") => {
    const entry = {
      event,
      details: String(details).replace(/\d{6,}/g, "[ID]"),
      time: Math.round(performance.now()),
    };
    eventsLogRef.current = [entry, ...eventsLogRef.current.slice(0, 14)];
    setDebugEvents([...eventsLogRef.current]);
  }, []);

  // Initialize debug state & orientation lock check on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("debugplayer") === "1") {
        setShowDebug(true);
      }
      if (typeof screen !== "undefined" && screen.orientation && typeof screen.orientation.lock === "function") {
        setCanOrientationLock(true);
      }
    }
  }, []);

  // Auto-hide controls timer (auto-hide after 3s while playing, stay visible while paused)
  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    // Only schedule auto-hide if currently playing and menus are closed
    if (playerInstanceRef.current && !isDraggingScrubberRef.current) {
      controlsTimeoutRef.current = setTimeout(() => {
        if (!destroyedRef.current) {
          playerInstanceRef.current?.getPaused().then((paused) => {
            if (!paused && !showSpeedSheet && !showQualityMenu) {
              setControlsVisible(false);
            }
          }).catch(() => {});
        }
      }, 3000);
    }
  }, [showSpeedSheet, showQualityMenu]);

  // Close open dropdowns on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowSpeedSheet(false);
        setShowQualityMenu(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Determine initial smart quality based on saved choice or network speed
  const getSmartStartQuality = useCallback(() => {
    try {
      const stored = localStorage.getItem("rd_preferred_quality");
      if (stored && stored !== "auto") return stored;
    } catch {}

    try {
      const conn =
        typeof navigator !== "undefined" &&
        (navigator.connection || navigator.mozConnection || navigator.webkitConnection);
      if (conn) {
        if (conn.saveData || conn.effectiveType === "slow-2g" || conn.effectiveType === "2g") {
          return "360p";
        }
        if (conn.effectiveType === "3g") {
          return "540p";
        }
      }
    } catch {}
    return "auto";
  }, []);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      addDebugEvent("online");
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

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
      if (!isFs) {
        setIsCssFullscreen(false);
        document.body.style.overflow = "";
        if (typeof screen !== "undefined" && screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock().catch(() => {});
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

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
              code: errData.code || (res.status === 403 ? "E:privacy" : "E:notfound"),
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
        if (data?.data?.durationSec) {
          durationRef.current = data.data.durationSec;
          if (durationDisplayRef.current) {
            durationDisplayRef.current.textContent = formatTime(data.data.durationSec);
          }
        }
        if (data?.data?.savedPositionSec) {
          lastSavedTimeRef.current = data.data.savedPositionSec;
          currentTimeRef.current = data.data.savedPositionSec;
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

  // Save progress helper
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

  // Report error to server
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

  // Safe SDK call wrapper: catches rejections, logs to server, shows toast, never kills player
  const safeSdkCall = useCallback(
    async (methodName, callFn, fallback = null, toastMsg = null) => {
      if (!playerInstanceRef.current || destroyedRef.current) return fallback;
      try {
        return await callFn(playerInstanceRef.current);
      } catch (err) {
        console.warn(`[Vimeo SDK SafeCall] ${methodName} rejected:`, err?.name, err?.message);
        reportErrorToServer("E:sdk_call", `${methodName}:${err?.name || "Error"}`, err?.message || "");
        if (toastMsg) {
          showToast(toastMsg);
        }
        return fallback;
      }
    },
    [reportErrorToServer, showToast]
  );

  // Manual Retry Handler (reloads player and preserves lastSavedTimeRef)
  const handleRetry = useCallback(() => {
    setSdkError(null);
    setPosterFaded(false);
    setHasStartedPlaying(false);
    setIsBuffering(false);
    setIsSeeking(false);
    setRetryKey((prev) => prev + 1);
    addDebugEvent("manual_retry", `${Math.round(lastSavedTimeRef.current)}s`);
  }, [addDebugEvent]);

  // --------------------------------------------------------------------------
  // Main Vimeo SDK Lifecycle
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!embedUrl || !iframeRef.current) return;

    let isCancelled = false;
    destroyedRef.current = false;
    mountTimeRef.current = performance.now();
    addDebugEvent("player_init");

    // 8-Second Safety Timeout: Always fade poster so player underneath is visible
    posterTimeoutRef.current = setTimeout(() => {
      if (!isCancelled) {
        setPosterFaded(true);
        setDebugStats((prev) => ({
          ...prev,
          posterRemovedBy: prev.posterRemovedBy || "timeout8s",
        }));
        addDebugEvent("poster_timeout_8s");
      }
    }, 8000);

    // 10-Second Load Recovery Timeout
    loadTimeoutRef.current = setTimeout(() => {
      if (!isCancelled && !posterFaded && retryCountRef.current < 2) {
        retryCountRef.current++;
        addDebugEvent(`load_stalled_retry_${retryCountRef.current}`);
        handleRetry();
      }
    }, 10000);

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
          if (mapped) {
            setSdkError(mapped);
            reportErrorToServer(mapped.code, err.name, err.message);
          }
          return;
        }

        // 1. SDK 'loaded' Event
        player.on("loaded", () => {
          if (isCancelled) return;
          clearTimeout(posterTimeoutRef.current);
          clearTimeout(loadTimeoutRef.current);
          setPosterFaded(true);
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

          // Fetch available qualities safely
          safeSdkCall(
            "getQualities",
            async (p) => {
              const qList = await p.getQualities();
              if (Array.isArray(qList) && qList.length > 0) {
                const normalized = qList
                  .map((item) => {
                    if (typeof item === "string") return { id: item, label: item };
                    if (item && typeof item === "object") {
                      const id = String(item.id || item.label || "");
                      const label = String(item.label || item.id || "");
                      return { id, label };
                    }
                    return null;
                  })
                  .filter((item) => item && item.id && item.id.toLowerCase() !== "auto");
                setQualities(normalized);

                // Smart start or saved manual choice application
                const smartQ = getSmartStartQuality();
                if (smartQ !== "auto" && normalized.some((q) => q.id === smartQ)) {
                  p.setQuality(smartQ).catch(() => {});
                  setSelectedQuality(smartQ);
                }
              }
            },
            null,
            null
          );

          // Get total duration
          player.getDuration().then((dur) => {
            durationRef.current = dur;
            if (durationDisplayRef.current) {
              durationDisplayRef.current.textContent = formatTime(dur);
            }
          }).catch(() => {});
        });

        // Track quality changes
        player.on("qualitychange", (data) => {
          if (isCancelled) return;
          const q = typeof data === "string" ? data : data?.quality;
          if (q) {
            setPlayingResolution(q);
            addDebugEvent("qualitychange", q);
          }
        });

        // 2. Play / Pause Events
        player.on("play", () => {
          if (isCancelled) return;
          setIsPlaying(true);
          setIsEnded(false);
          setIsBuffering(false);
          setHasStartedPlaying(true);
          resetControlsTimer();
          addDebugEvent("play");
        });

        player.on("playing", () => {
          if (isCancelled) return;
          setIsPlaying(true);
          setIsBuffering(false);
          setIsSeeking(false);
          setHasStartedPlaying(true);
          addDebugEvent("playing");

          if (!firstPlayLoggedRef.current) {
            firstPlayLoggedRef.current = true;
            const elapsed = Math.round(performance.now() - mountTimeRef.current);
            setDebugStats((prev) => ({ ...prev, timeToFirstPlayMs: elapsed }));
            addDebugEvent("first_playing", `${elapsed}ms`);
          }
        });

        player.on("pause", () => {
          if (isCancelled) return;
          setIsPlaying(false);
          setControlsVisible(true);
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
          addDebugEvent("pause");

          player.getCurrentTime().then((sec) => {
            player.getDuration().then((dur) => saveProgress(sec, dur, false));
          }).catch(() => {});
        });

        // 3. Timeupdate Event (Direct DOM updates for 60fps seekbar without React re-render)
        player.on("timeupdate", (data) => {
          if (isCancelled || isDraggingScrubberRef.current) return;
          const sec = data.seconds || 0;
          const dur = data.duration || durationRef.current || 1;
          currentTimeRef.current = sec;
          durationRef.current = dur;

          const pct = Math.min(100, Math.max(0, (sec / dur) * 100));

          if (progressBarRef.current) {
            progressBarRef.current.style.width = `${pct}%`;
          }
          if (scrubberHandleRef.current) {
            scrubberHandleRef.current.style.left = `${pct}%`;
          }
          if (currentTimeDisplayRef.current) {
            currentTimeDisplayRef.current.textContent = formatTime(sec);
          }
          if (durationDisplayRef.current) {
            durationDisplayRef.current.textContent = formatTime(dur);
          }
        });

        // Progress buffer bar update
        player.on("progress", (data) => {
          if (isCancelled || !bufferedBarRef.current) return;
          const pct = Math.min(100, Math.max(0, (data.percent || 0) * 100));
          bufferedBarRef.current.style.width = `${pct}%`;
        });

        // 4. Buffering & Waiting
        player.on("bufferstart", () => {
          if (isCancelled) return;
          bufferStartRef.current = Date.now();
          setIsBuffering(true);
          addDebugEvent("bufferstart");
        });
        player.on("bufferend", () => {
          if (isCancelled) return;
          setIsBuffering(false);
          addDebugEvent("bufferend");

          if (bufferStartRef.current) {
            const dur = Date.now() - bufferStartRef.current;
            bufferStartRef.current = null;
            if (dur > 1500) {
              const now = Date.now();
              bufferSpansRef.current = [
                ...bufferSpansRef.current.filter((ts) => now - ts < 60000),
                now,
              ];
              if (
                selectedQuality === "auto" &&
                bufferSpansRef.current.length >= 2 &&
                !hasNudgedRef.current
              ) {
                hasNudgedRef.current = true;
                showToast(
                  "Internet slow? Switch to 360p",
                  "Switch",
                  () => handleSetQuality("360p"),
                  8000
                );
              }
            }
          }
        });
        player.on("waiting", () => {
          if (isCancelled) return;
          setIsBuffering(true);
          addDebugEvent("waiting");
        });

        // 5. Seeking Events
        player.on("seeking", (data) => {
          if (isCancelled) return;
          seekingRef.current = true;
          seekTargetRef.current = data?.seconds || 0;
          setIsSeeking(true);
          addDebugEvent("seeking", `${Math.round(data?.seconds || 0)}s`);

          clearTimeout(seekTimeoutRef.current);
          seekTimeoutRef.current = setTimeout(() => {
            if (seekingRef.current && playerInstanceRef.current && !destroyedRef.current) {
              addDebugEvent("seek_retry_10s");
              playerInstanceRef.current.setCurrentTime(seekTargetRef.current).catch(() => {});
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

          player.getDuration().then((dur) => {
            saveProgress(data?.seconds || 0, dur, false);
          }).catch(() => {});
        });

        // 6. Ended Event
        player.on("ended", () => {
          if (isCancelled) return;
          setIsPlaying(false);
          setIsEnded(true);
          setControlsVisible(true);
          addDebugEvent("ended");

          player.getDuration().then((dur) => {
            saveProgress(dur, dur, true);
          }).catch(() => {});
          if (onComplete) onComplete();
        });

        // 7. Error Event
        player.on("error", (err) => {
          if (isCancelled) return;
          const mapped = mapVimeoError(err);
          if (!mapped) return; // Ignore transient abort / interrupted errors
          setSdkError(mapped);
          setIsBuffering(false);
          setIsSeeking(false);
          addDebugEvent("error", `${mapped.code}: ${err.name}`);
          reportErrorToServer(mapped.code, err.name, err.message);
        });

        // Initial autoplay trigger if requested
        if (autoPlay) {
          player.play().catch(() => {});
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          const mapped = mapVimeoError(err);
          if (mapped) {
            setSdkError(mapped);
            reportErrorToServer(mapped.code, err.name, err.message);
          }
        }
      });

    // Cleanup: StrictMode safe, unhook events without destroying React's DOM iframe
    return () => {
      isCancelled = true;
      destroyedRef.current = true;
      clearTimeout(posterTimeoutRef.current);
      clearTimeout(loadTimeoutRef.current);
      clearTimeout(seekTimeoutRef.current);
      clearTimeout(controlsTimeoutRef.current);
      clearTimeout(doubleTapTimerRef.current);
      clearTimeout(longPressTimerRef.current);

      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.off("loaded");
          playerInstanceRef.current.off("play");
          playerInstanceRef.current.off("playing");
          playerInstanceRef.current.off("pause");
          playerInstanceRef.current.off("timeupdate");
          playerInstanceRef.current.off("progress");
          playerInstanceRef.current.off("bufferstart");
          playerInstanceRef.current.off("bufferend");
          playerInstanceRef.current.off("waiting");
          playerInstanceRef.current.off("seeking");
          playerInstanceRef.current.off("seeked");
          playerInstanceRef.current.off("ended");
          playerInstanceRef.current.off("qualitychange");
          playerInstanceRef.current.off("error");
          playerInstanceRef.current.pause().catch(() => {});
        } catch {}
        playerInstanceRef.current = null;
      }
    };
  }, [
    embedUrl,
    retryKey,
    onLoaded,
    onComplete,
    saveProgress,
    reportErrorToServer,
    handleRetry,
    addDebugEvent,
    resetControlsTimer,
    safeSdkCall,
    getSmartStartQuality,
    showToast,
  ]);

  // Handle autoPlay toggle
  useEffect(() => {
    if (autoPlay && playerInstanceRef.current && !destroyedRef.current) {
      playerInstanceRef.current.play().catch(() => {});
    }
  }, [autoPlay]);

  // --------------------------------------------------------------------------
  // Core Controls: Play, Pause, Seek, Speed, Fullscreen
  // --------------------------------------------------------------------------
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      safeSdkCall("pause", (p) => p.pause(), null, null);
    } else {
      safeSdkCall("play", (p) => p.play(), null, null);
    }
    resetControlsTimer();
  }, [isPlaying, resetControlsTimer, safeSdkCall]);

  const seekRelative = useCallback(
    (deltaSeconds) => {
      const dur = durationRef.current || 1;
      const target = Math.min(dur, Math.max(0, currentTimeRef.current + deltaSeconds));
      currentTimeRef.current = target;
      safeSdkCall("setCurrentTime", (p) => p.setCurrentTime(target), null, null);
      resetControlsTimer();
    },
    [resetControlsTimer, safeSdkCall]
  );

  const handleSetSpeed = useCallback(
    (speed) => {
      setShowSpeedSheet(false);
      resetControlsTimer();
      safeSdkCall(
        "setPlaybackRate",
        async (player) => {
          await player.setPlaybackRate(speed);
          setPlaybackRate(speed);
        },
        null,
        "Could not change speed"
      );
    },
    [resetControlsTimer, safeSdkCall]
  );

  const handleSetQuality = useCallback(
    (qualityId) => {
      setSelectedQuality(qualityId);
      setShowQualityMenu(false);
      resetControlsTimer();

      try {
        localStorage.setItem("rd_preferred_quality", qualityId);
      } catch {}

      safeSdkCall(
        "setQuality",
        async (player) => {
          await player.setQuality(qualityId);
        },
        null,
        "Could not change quality"
      ).then((res) => {
        // Fall back to auto if setting specific quality rejected
        if (res === null && qualityId !== "auto") {
          setSelectedQuality("auto");
        }
      });
    },
    [resetControlsTimer, safeSdkCall]
  );

  const toggleMute = useCallback(() => {
    if (isMuted) {
      safeSdkCall("setVolume", (p) => p.setVolume(volume || 1), null, null).then(() => {
        setIsMuted(false);
        resetControlsTimer();
      });
    } else {
      safeSdkCall("setVolume", (p) => p.setVolume(0), null, null).then(() => {
        setIsMuted(true);
        resetControlsTimer();
      });
    }
  }, [isMuted, volume, resetControlsTimer, safeSdkCall]);

  // Fullscreen: Fullscreen API on wrapper with CSS fullscreen fallback (iOS Safari)
  const toggleFullscreen = useCallback(async () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    if (!document.fullscreenElement && !isCssFullscreen) {
      if (wrapper.requestFullscreen) {
        try {
          await wrapper.requestFullscreen({ navigationUI: "hide" });
          setIsFullscreen(true);
          resetControlsTimer();
          return;
        } catch (e) {
          console.warn("requestFullscreen failed, fallback to CSS fullscreen", e);
        }
      }
      // CSS Fallback
      setIsCssFullscreen(true);
      setIsFullscreen(true);
      document.body.style.overflow = "hidden";
      resetControlsTimer();
    } else {
      // Exit fullscreen
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      }
      setIsCssFullscreen(false);
      setIsFullscreen(false);
      document.body.style.overflow = "";
      if (typeof screen !== "undefined" && screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock().catch(() => {});
      }
      resetControlsTimer();
    }
  }, [isCssFullscreen, resetControlsTimer]);

  // Lock to landscape in fullscreen (Android Chrome)
  const handleRotateFullscreen = useCallback(() => {
    if (typeof screen !== "undefined" && screen.orientation && typeof screen.orientation.lock === "function") {
      screen.orientation.lock("landscape").catch((err) => {
        console.warn("Orientation lock not supported:", err.message);
      });
    }
  }, []);

  // --------------------------------------------------------------------------
  // Gesture Handling: Single Tap, Double Tap (Left/Right ±10s), Long Press (2x)
  // --------------------------------------------------------------------------
  const triggerRipple = (side, text) => {
    setRipple({ side, text, id: Date.now() });
    setTimeout(() => {
      setRipple((prev) => (prev?.text === text ? null : prev));
    }, 650);
  };

  const handlePointerDown = (e) => {
    // Only handle primary pointer (touch or left mouse button)
    if (e.button !== undefined && e.button !== 0) return;

    // Start 500ms press-and-hold timer for 2x speed
    longPressTimerRef.current = setTimeout(() => {
      if (playerInstanceRef.current && isPlaying && !destroyedRef.current) {
        previousRateRef.current = playbackRate;
        playerInstanceRef.current.setPlaybackRate(2).then(() => {
          setIsHolding2x(true);
        }).catch(() => {});
      }
    }, 500);
  };

  const handlePointerUp = (e) => {
    // Release 2x speed if active
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    if (isHolding2x) {
      setIsHolding2x(false);
      if (playerInstanceRef.current && !destroyedRef.current) {
        playerInstanceRef.current.setPlaybackRate(previousRateRef.current || 1).catch(() => {});
      }
      return;
    }

    // Measure tap coordinates relative to video rect
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (timeSinceLastTap < 300) {
      // DOUBLE TAP DETECTED
      clearTimeout(doubleTapTimerRef.current);
      lastTapTimeRef.current = 0;

      if (ratio < 0.35) {
        // Left third: Seek backward 10s (accumulates)
        tapAccumulatorRef.current = (tapAccumulatorRef.current || 0) - 10;
        seekRelative(-10);
        triggerRipple("left", `${tapAccumulatorRef.current}s`);
      } else if (ratio > 0.65) {
        // Right third: Seek forward 10s (accumulates)
        tapAccumulatorRef.current = (tapAccumulatorRef.current || 0) + 10;
        seekRelative(10);
        triggerRipple("right", `+${tapAccumulatorRef.current}s`);
      } else {
        // Center: Toggle Play / Pause
        togglePlayPause();
        triggerRipple("center", isPlaying ? "Pause" : "Play");
      }

      // Reset accumulator after pause
      setTimeout(() => {
        tapAccumulatorRef.current = 0;
      }, 700);
    } else {
      // SINGLE TAP
      lastTapTimeRef.current = now;
      doubleTapTimerRef.current = setTimeout(() => {
        // Single tap toggle controls
        if (controlsVisible) {
          if (isPlaying) setControlsVisible(false);
        } else {
          resetControlsTimer();
        }
      }, 300);
    }
  };

  // --------------------------------------------------------------------------
  // Draggable Scrubber Logic (Pointer Events, Touch Safe)
  // --------------------------------------------------------------------------
  const handleScrubberPointerDown = (e) => {
    e.stopPropagation();
    isDraggingScrubberRef.current = true;
    updateScrubberPosition(e);

    const onPointerMove = (ev) => {
      if (isDraggingScrubberRef.current) {
        updateScrubberPosition(ev);
      }
    };

    const onPointerUp = (ev) => {
      if (isDraggingScrubberRef.current) {
        isDraggingScrubberRef.current = false;
        const dur = durationRef.current || 1;
        const targetSec = currentTimeRef.current;
        if (playerInstanceRef.current) {
          playerInstanceRef.current.setCurrentTime(targetSec).catch(() => {});
        }
        if (scrubTooltipRef.current) {
          scrubTooltipRef.current.style.opacity = "0";
        }
        resetControlsTimer();
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const updateScrubberPosition = (e) => {
    const track = scrubberTrackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = (x / rect.width) * 100;
    const dur = durationRef.current || 1;
    const scrubbedSec = (pct / 100) * dur;

    currentTimeRef.current = scrubbedSec;

    if (progressBarRef.current) progressBarRef.current.style.width = `${pct}%`;
    if (scrubberHandleRef.current) scrubberHandleRef.current.style.left = `${pct}%`;
    if (currentTimeDisplayRef.current) currentTimeDisplayRef.current.textContent = formatTime(scrubbedSec);

    // Update floating drag tooltip
    if (scrubTooltipRef.current) {
      scrubTooltipRef.current.style.opacity = "1";
      scrubTooltipRef.current.style.left = `${pct}%`;
      scrubTooltipRef.current.textContent = formatTime(scrubbedSec);
    }
  };

  // --------------------------------------------------------------------------
  // Desktop Keyboard Shortcuts
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

      const key = e.key;
      if (key === " " || key === "k" || key === "K") {
        e.preventDefault();
        togglePlayPause();
      } else if (key === "ArrowLeft") {
        e.preventDefault();
        seekRelative(-5);
        triggerRipple("left", "-5s");
      } else if (key === "ArrowRight") {
        e.preventDefault();
        seekRelative(5);
        triggerRipple("right", "+5s");
      } else if (key === "j" || key === "J") {
        e.preventDefault();
        seekRelative(-10);
        triggerRipple("left", "-10s");
      } else if (key === "l" || key === "L") {
        e.preventDefault();
        seekRelative(10);
        triggerRipple("right", "+10s");
      } else if (key === "m" || key === "M") {
        e.preventDefault();
        toggleMute();
      } else if (key === "f" || key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (key === ",") {
        // Decrease speed
        e.preventDefault();
        const idx = AVAILABLE_SPEEDS.indexOf(playbackRate);
        if (idx > 0) handleSetSpeed(AVAILABLE_SPEEDS[idx - 1]);
      } else if (key === ".") {
        // Increase speed
        e.preventDefault();
        const idx = AVAILABLE_SPEEDS.indexOf(playbackRate);
        if (idx < AVAILABLE_SPEEDS.length - 1) handleSetSpeed(AVAILABLE_SPEEDS[idx + 1]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlayPause, seekRelative, toggleMute, toggleFullscreen, playbackRate, handleSetSpeed]);

  return (
    <div
      ref={wrapperRef}
      onMouseMove={resetControlsTimer}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className={`relative w-full aspect-video bg-black select-none overflow-hidden transition-all duration-200 ${
        isCssFullscreen
          ? "fixed inset-0 z-[999999] w-screen h-[100dvh] rounded-0 bg-black flex items-center justify-center"
          : isFullscreen
          ? "w-full h-full bg-black flex items-center justify-center rounded-0"
          : "rounded-[22px] shadow-2xl border border-black/10"
      } ${className}`}
      style={{
        WebkitTouchCallout: "none",
        touchAction: "manipulation",
      }}
    >
      {/* 1. Vimeo Iframe: Single mount, allow without duplicate allowfullscreen */}
      <iframe
        ref={iframeRef}
        key={`vimeo-ifr-${lectureId}-${retryKey}`}
        src={embedUrl || undefined}
        allow="autoplay; fullscreen; encrypted-media"
        className={`w-full h-full border-0 absolute inset-0 z-10 ${
          isFullscreen || isCssFullscreen ? "max-w-full max-h-full aspect-video m-auto" : ""
        }`}
        title="RD Classes Lecture Video"
      />

      {/* 2. Branded Poster (fades strictly on 'loaded' or after 8s) */}
      <div
        className={`absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-br from-[#0B2A4A] via-[#071D36] to-[#041324] transition-opacity duration-700 pointer-events-none ${
          posterFaded || hasStartedPlaying ? "opacity-0 invisible pointer-events-none" : "opacity-100 visible"
        }`}
        aria-hidden={posterFaded || hasStartedPlaying}
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

      {/* 3. Transparent Gesture Layer (Intercepts single tap, double tap, and long press) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 z-20 cursor-pointer pointer-events-auto bg-transparent"
        aria-label="Video gesture surface"
      />

      {/* 4. Double-Tap Seek Ripples & Press-and-Hold 2x Indicator */}
      {ripple && (
        <div
          className={`absolute inset-y-0 z-35 flex items-center justify-center pointer-events-none animate-fade-in ${
            ripple.side === "left"
              ? "left-0 w-1/3 bg-white/10 rounded-r-full"
              : ripple.side === "right"
              ? "right-0 w-1/3 bg-white/10 rounded-l-full"
              : "inset-x-0 bg-white/5"
          }`}
        >
          <div className="flex flex-col items-center gap-1 text-white font-black text-sm tracking-wider uppercase drop-shadow-md">
            {ripple.side === "left" ? (
              <RotateCcw className="w-7 h-7 text-[#FFC93C] animate-pulse" />
            ) : ripple.side === "right" ? (
              <RotateCw className="w-7 h-7 text-[#FFC93C] animate-pulse" />
            ) : null}
            <span>{ripple.text}</span>
          </div>
        </div>
      )}

      {isHolding2x && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[#FFC93C] font-bold text-xs flex items-center gap-1.5 shadow-xl animate-pulse pointer-events-none">
          <span>2x Speed</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      )}

      {/* Non-intrusive Toast Notification Banner */}
      {toast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 max-w-[90%] px-3.5 py-2 rounded-xl bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-medium flex items-center gap-2.5 shadow-2xl animate-fade-in pointer-events-auto">
          <span>{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction();
                setToast(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#FFC93C] text-[#0B2A4A] font-bold text-[11px] hover:bg-[#FFB800] transition-colors cursor-pointer shrink-0"
            >
              {toast.actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-white/60 hover:text-white p-0.5 cursor-pointer ml-1 shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 5. Custom Controls Layer */}
      <div
        className={`absolute inset-0 z-30 flex flex-col justify-between pointer-events-none transition-opacity duration-300 ${
          controlsVisible || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Top Control Bar */}
        <div className="w-full bg-gradient-to-b from-black/85 via-black/40 to-transparent p-3 sm:p-4 flex items-center justify-between text-white pointer-events-auto">
          <div className="min-w-0 pr-3">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FFC93C] block truncate">
              {isFreePreview ? "FREE PREVIEW" : "RD CLASSES"}
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-md sm:max-w-xl">
              {lectureTitle}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {isFullscreen && !onClose && (
              <button
                type="button"
                onClick={toggleFullscreen}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Exit Fullscreen"
              >
                <Minimize className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Center Control Buttons (-10s, Play/Pause/Spinner, +10s) */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 pointer-events-auto">
          {/* -10s Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              seekRelative(-10);
              triggerRipple("left", "-10s");
            }}
            className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/50 hover:bg-black/70 active:scale-90 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-transform cursor-pointer"
            aria-label="Rewind 10 seconds"
          >
            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Main Play / Pause / Replay Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isEnded) {
                if (playerInstanceRef.current) {
                  playerInstanceRef.current.setCurrentTime(0).then(() => {
                    playerInstanceRef.current.play().catch(() => {});
                  });
                }
              } else {
                togglePlayPause();
              }
            }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FFC93C] hover:bg-[#FFB800] active:scale-95 text-[#0B2A4A] flex items-center justify-center shadow-2xl transition-transform cursor-pointer"
            aria-label={isEnded ? "Replay Video" : isPlaying ? "Pause Video" : "Play Video"}
          >
            {isBuffering || isSeeking ? (
              <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin" />
            ) : isEnded ? (
              <RotateCcw className="w-7 h-7 sm:w-8 sm:h-8" />
            ) : isPlaying ? (
              <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
            ) : (
              <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-0.5" />
            )}
          </button>

          {/* +10s Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              seekRelative(10);
              triggerRipple("right", "+10s");
            }}
            className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/50 hover:bg-black/70 active:scale-90 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-transform cursor-pointer"
            aria-label="Fast forward 10 seconds"
          >
            <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Bottom Control Bar */}
        <div className="w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 sm:p-4 space-y-2 pointer-events-auto">
          {/* Scrubber / Seek Bar (44px touch target) */}
          <div
            ref={scrubberTrackRef}
            onPointerDown={handleScrubberPointerDown}
            className="relative h-7 flex items-center cursor-pointer group touch-none"
            aria-label="Video scrubber"
          >
            {/* Background Track */}
            <div className="w-full h-1.5 group-hover:h-2 rounded-full bg-white/20 relative overflow-hidden transition-all">
              {/* Buffered Bar */}
              <div
                ref={bufferedBarRef}
                className="absolute inset-y-0 left-0 bg-white/35 transition-all duration-150"
                style={{ width: "0%" }}
              />
              {/* Played Bar */}
              <div
                ref={progressBarRef}
                className="absolute inset-y-0 left-0 bg-[#FFC93C] transition-none"
                style={{ width: "0%" }}
              />
            </div>

            {/* Draggable Scrubber Thumb */}
            <div
              ref={scrubberHandleRef}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#FFC93C] border-2 border-white shadow-md transition-transform scale-0 group-hover:scale-100 group-active:scale-125"
              style={{ left: "0%" }}
            />

            {/* Time Tooltip while Scrubbing */}
            <div
              ref={scrubTooltipRef}
              className="absolute bottom-6 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 border border-white/20 text-white font-mono text-[11px] opacity-0 pointer-events-none transition-opacity"
              style={{ left: "0%" }}
            >
              00:00
            </div>
          </div>

          {/* Controls Bottom Row */}
          <div className="flex items-center justify-between text-white text-xs">
            {/* Time Display */}
            <div className="flex items-center gap-1.5 font-mono text-white/90 text-[11px] sm:text-xs">
              <span ref={currentTimeDisplayRef}>00:00</span>
              <span className="text-white/40">/</span>
              <span ref={durationDisplayRef}>{formatTime(durationSeconds || 0)}</span>
            </div>

            {/* Right Buttons: Speed, Qualities, Mute, Rotate, Fullscreen */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Speed Chip */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowSpeedSheet((prev) => !prev);
                    setShowQualityMenu(false);
                  }}
                  className="h-8 min-w-[36px] px-2 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  aria-label="Playback speed"
                  aria-expanded={showSpeedSheet}
                >
                  <span>{playbackRate}x</span>
                </button>

                {/* Speed Sheet: Mobile Bottom Sheet & Desktop Popover */}
                {showSpeedSheet && (
                  <MenuErrorBoundary
                    onError={() => {
                      setShowSpeedSheet(false);
                      showToast("Could not display speed menu");
                    }}
                  >
                    {/* Mobile Backdrop */}
                    <div
                      className="fixed inset-0 z-40 bg-black/50 sm:hidden"
                      onClick={() => setShowSpeedSheet(false)}
                    />
                    <div
                      className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl sm:rounded-xl bg-[#0B2A4A]/98 backdrop-blur-md border border-white/15 p-3.5 sm:p-2 shadow-2xl flex flex-col gap-1 sm:absolute sm:inset-x-auto sm:bottom-10 sm:right-0 sm:min-w-[120px] max-h-[70vh] overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10 sm:border-none">
                        <span className="text-[11px] font-bold text-[#FFC93C] uppercase tracking-wider px-1">
                          Speed
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowSpeedSheet(false)}
                          className="sm:hidden p-1 rounded-full text-white/70 hover:text-white cursor-pointer"
                          aria-label="Close speed menu"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {AVAILABLE_SPEEDS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSetSpeed(s)}
                          className={`px-3 py-2 sm:py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                            playbackRate === s
                              ? "bg-[#FFC93C] text-[#0B2A4A] font-bold"
                              : "text-white/90 hover:bg-white/10"
                          }`}
                        >
                          <span>{s}x</span>
                          {playbackRate === s && <span className="font-bold">✓</span>}
                        </button>
                      ))}
                    </div>
                  </MenuErrorBoundary>
                )}
              </div>

              {/* Quality Menu (if exposed) */}
              {qualities.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQualityMenu((prev) => !prev);
                      setShowSpeedSheet(false);
                    }}
                    className="h-8 min-w-[44px] px-2 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    aria-label="Video Quality"
                    aria-expanded={showQualityMenu}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                    <span className="capitalize">{selectedQuality === "auto" ? "Auto" : selectedQuality}</span>
                  </button>

                  {/* Quality Menu: Mobile Bottom Sheet & Desktop Popover */}
                  {showQualityMenu && (
                    <MenuErrorBoundary
                      onError={() => {
                        setShowQualityMenu(false);
                        showToast("Could not display quality menu");
                      }}
                    >
                      {/* Mobile Backdrop */}
                      <div
                        className="fixed inset-0 z-40 bg-black/50 sm:hidden"
                        onClick={() => setShowQualityMenu(false)}
                      />
                      <div
                        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl sm:rounded-xl bg-[#0B2A4A]/98 backdrop-blur-md border border-white/15 p-3.5 sm:p-2 shadow-2xl flex flex-col gap-1 sm:absolute sm:inset-x-auto sm:bottom-10 sm:right-0 sm:min-w-[195px] max-h-[70vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Header with Title and Close on mobile */}
                        <div className="flex items-center justify-between pb-1.5 border-b border-white/10 sm:border-none">
                          <span className="text-[11px] font-bold text-[#FFC93C] uppercase tracking-wider px-1">
                            Quality
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowQualityMenu(false)}
                            className="sm:hidden p-1 rounded-full text-white/70 hover:text-white cursor-pointer"
                            aria-label="Close quality menu"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* 1. Auto (recommended) */}
                        <button
                          type="button"
                          onClick={() => handleSetQuality("auto")}
                          className={`px-3 py-2 sm:py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                            selectedQuality === "auto"
                              ? "bg-[#FFC93C] text-[#0B2A4A] font-bold"
                              : "text-white/90 hover:bg-white/10"
                          }`}
                        >
                          <span>Auto (recommended){playingResolution ? ` (${playingResolution})` : ""}</span>
                          {selectedQuality === "auto" && <span className="font-bold">✓</span>}
                        </button>

                        {/* 2. Specific Qualities */}
                        {qualities.map((q) => (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => handleSetQuality(q.id)}
                            className={`px-3 py-2 sm:py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                              selectedQuality === q.id
                                ? "bg-[#FFC93C] text-[#0B2A4A] font-bold"
                                : "text-white/90 hover:bg-white/10"
                            }`}
                          >
                            <span>{q.label}</span>
                            {selectedQuality === q.id && <span className="font-bold">✓</span>}
                          </button>
                        ))}

                        {/* Hint */}
                        <p className="text-[10px] text-white/50 px-2 pt-1 border-t border-white/10 mt-1 leading-tight">
                          Choose a lower quality if your internet is slow.
                        </p>
                      </div>
                    </MenuErrorBoundary>
                  )}
                </div>
              )}

              {/* Mute Button (desktop only; mobile uses hardware volume) */}
              <button
                type="button"
                onClick={toggleMute}
                className="hidden sm:flex h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-colors cursor-pointer"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Android Landscape Rotate Button inside Fullscreen */}
              {isFullscreen && canOrientationLock && (
                <button
                  type="button"
                  onClick={handleRotateFullscreen}
                  className="h-8 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 text-[11px] font-bold transition-colors cursor-pointer"
                  aria-label="Rotate to Landscape"
                >
                  <Smartphone className="w-3.5 h-3.5 rotate-90" />
                  <span className="hidden sm:inline">Rotate</span>
                </button>
              )}

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Ended Overlay Screen with Replay and Next Lecture */}
      {isEnded && (
        <div className="absolute inset-0 z-35 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-white p-4">
          <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">Lecture Completed</h4>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (playerInstanceRef.current) {
                  playerInstanceRef.current.setCurrentTime(0).then(() => {
                    playerInstanceRef.current.play().catch(() => {});
                  });
                }
              }}
              className="flex items-center gap-2 h-10 px-5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-transform active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Replay</span>
            </button>

            {(nextLectureId || onNextLecture) && (
              <button
                type="button"
                onClick={() => {
                  if (onNextLecture) onNextLecture();
                }}
                className="flex items-center gap-2 h-10 px-5 rounded-full bg-[#FFC93C] hover:bg-[#FFB800] text-[#0B2A4A] font-bold text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <span>Next Lecture</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 7. Offline Banner */}
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

      {/* 8. Friendly Error Screen */}
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

      {/* 9. Dynamic Floating Watermark (Direct DOM positioning, zero React state re-renders) */}
      <Watermark
        studentName={studentMeta.name}
        loginId={studentMeta.loginId}
        phone={studentMeta.phone}
        text={watermarkText}
        isFreePreview={isFreePreview}
      />

      {/* 10. Hidden Debug Overlay (?debugplayer=1, never leaks vimeoId or hash) */}
      {showDebug && (
        <div
          className="absolute bottom-16 left-3 z-50 bg-black/90 text-emerald-400 p-3 rounded-xl font-mono text-[10px] max-w-xs max-h-48 overflow-y-auto border border-emerald-500/30 backdrop-blur-md shadow-2xl pointer-events-auto"
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
          <div>State: {isPlaying ? "Playing" : "Paused"} | Rate: {playbackRate}x</div>
          <div>Fullscreen: {isFullscreen ? "Active" : "No"} ({isCssFullscreen ? "CSS" : "Native"})</div>
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
