"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  AlertTriangle,
  Loader2,
} from "lucide-react";

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function VideoPlayer({
  lectureId,
  src: propSrc,
  provider: propProvider = "hls",
  initialPosition = 0,
  watermark = null, // { name: string, loginId: string }
  onProgressUpdate = null,
  className = "",
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const progressTimerRef = useRef(null);

  // Stream state
  const [loading, setLoading] = useState(!propSrc);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(propSrc || "");
  const [videoProvider, setVideoProvider] = useState(propProvider);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("rd_video_volume");
      return saved !== null ? Number(saved) : 1;
    }
    return 1;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Quality menu
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
  const [showSettings, setShowSettings] = useState(false);

  // Moving watermark position (shifts every 20s)
  const [watermarkPos, setWatermarkPos] = useState({ top: "20%", left: "20%" });
  const [watermarkData, setWatermarkData] = useState(watermark);

  // Fetch verified stream from server if lectureId is provided
  useEffect(() => {
    if (!lectureId || propSrc) return;

    let cancelled = false;

    async function fetchStream() {
      try {
        const res = await fetch(`/api/student/lectures/${lectureId}/stream`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Unable to play video");
        setVideoUrl(data.stream.videoUrl);
        setVideoProvider(data.stream.videoProvider || "hls");
        if (data.watermark) {
          setWatermarkData(data.watermark);
        }
        if (data.stream.lastWatchedSeconds && videoRef.current) {
          videoRef.current.currentTime = data.stream.lastWatchedSeconds;
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStream();

    return () => {
      cancelled = true;
    };
  }, [lectureId, propSrc]);

  // Moving Watermark: updates position every 20s
  useEffect(() => {
    const positions = [
      { top: "15%", left: "15%" },
      { top: "15%", left: "65%" },
      { top: "65%", left: "20%" },
      { top: "70%", left: "60%" },
      { top: "40%", left: "45%" },
      { top: "25%", left: "75%" },
      { top: "60%", left: "10%" },
    ];
    let posIdx = 0;

    const interval = setInterval(() => {
      posIdx = (posIdx + 1) % positions.length;
      setWatermarkPos(positions[posIdx]);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  // Save Progress Heartbeat
  const saveProgress = useCallback(
    async (timeToSave, isCompleted = false) => {
      if (!lectureId) return;
      try {
        await fetch(`/api/student/lectures/${lectureId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            watchedSeconds: Math.floor(timeToSave),
            completed: isCompleted,
          }),
        });
        if (onProgressUpdate) {
          onProgressUpdate(timeToSave);
        }
      } catch (err) {
        // silent fail on progress save
      }
    },
    [lectureId, onProgressUpdate]
  );

  // Progress save every 10s while playing
  useEffect(() => {
    if (isPlaying) {
      progressTimerRef.current = setInterval(() => {
        if (videoRef.current) {
          saveProgress(videoRef.current.currentTime);
        }
      }, 10000);
    } else {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, saveProgress]);

  // Save on pause / page unload
  useEffect(() => {
    const video = videoRef.current;
    const handleBeforeUnload = () => {
      if (video) {
        saveProgress(video.currentTime);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (video) {
        saveProgress(video.currentTime);
      }
    };
  }, [saveProgress]);

  // HLS Setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const isDirectHls = videoUrl.includes(".m3u8") || videoProvider === "hls";

    if (isDirectHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });
        hlsRef.current = hls;

        hls.loadSource(videoUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          setQualities(
            data.levels.map((level, idx) => ({
              id: idx,
              height: level.height,
              name: `${level.height}p`,
            }))
          );

          if (initialPosition > 0) {
            video.currentTime = initialPosition;
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setError("Playback error encountered.");
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native Safari HLS
        video.src = videoUrl;
        if (initialPosition > 0) {
          video.currentTime = initialPosition;
        }
      }
    } else {
      // Direct MP4
      video.src = videoUrl;
      if (initialPosition > 0) {
        video.currentTime = initialPosition;
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl, videoProvider, initialPosition]);

  // Volume & Playback Rate Sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
      saveProgress(video.currentTime);
    }
  }, [saveProgress]);

  const skip = useCallback((seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds)
      );
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = pos * duration;
    }
  };

  const handleQualityChange = (levelIdx) => {
    setCurrentQuality(levelIdx);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIdx;
    }
    setShowSettings(false);
  };

  // Keyboard Shortcuts (Space, Arrows, F, M)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
        case "j":
          e.preventDefault();
          skip(-10);
          break;
        case "ArrowRight":
        case "l":
          e.preventDefault();
          skip(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume((v) => {
            const next = Math.min(1, v + 0.1);
            localStorage.setItem("rd_video_volume", String(next));
            return next;
          });
          setIsMuted(false);
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume((v) => {
            const next = Math.max(0, v - 0.1);
            localStorage.setItem("rd_video_volume", String(next));
            return next;
          });
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          setIsMuted((m) => !m);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, skip, toggleFullscreen]);

  // Render iframe for Vimeo, YouTube or Bunny Stream embed if needed
  if (videoProvider === "vimeo") {
    const vimeoSrc = videoUrl.includes("player.vimeo.com")
      ? videoUrl
      : `https://player.vimeo.com/video/${videoUrl.replace(/[^0-9]/g, "")}?badge=0&autopause=0&player_id=0`;

    return (
      <div
        onContextMenu={(e) => e.preventDefault()}
        className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-black select-none ${className}`}
      >
        <iframe
          src={vimeoSrc}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
        {/* Dynamic Watermark */}
        {watermarkData && (
          <div
            style={{ top: watermarkPos.top, left: watermarkPos.left }}
            className="absolute pointer-events-none z-30 transition-all duration-1000 select-none text-[11px] font-mono text-white/25 px-2 py-1 rounded bg-black/20"
          >
            {watermarkData.name} ({watermarkData.loginId})
          </div>
        )}
      </div>
    );
  }

  if (videoProvider === "youtube") {
    const yId = videoUrl.split("v=")[1]?.split("&")[0] || videoUrl.split("/").pop();
    const ytSrc = `https://www.youtube.com/embed/${yId}?modestbranding=1&rel=0`;

    return (
      <div
        onContextMenu={(e) => e.preventDefault()}
        className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-black select-none ${className}`}
      >
        <iframe
          src={ytSrc}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        {/* Dynamic Watermark */}
        {watermarkData && (
          <div
            style={{ top: watermarkPos.top, left: watermarkPos.left }}
            className="absolute pointer-events-none z-30 transition-all duration-1000 select-none text-[11px] font-mono text-white/25 px-2 py-1 rounded bg-black/20"
          >
            {watermarkData.name} ({watermarkData.loginId})
          </div>
        )}
      </div>
    );
  }

  if (videoProvider === "bunny" && videoUrl.includes("iframe.mediadelivery.net")) {
    return (
      <div
        onContextMenu={(e) => e.preventDefault()}
        className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-black select-none ${className}`}
      >
        <iframe
          src={videoUrl}
          className="w-full h-full border-0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
        />
        {/* Dynamic Watermark */}
        {watermarkData && (
          <div
            style={{ top: watermarkPos.top, left: watermarkPos.left }}
            className="absolute pointer-events-none z-30 transition-all duration-1000 select-none text-[11px] font-mono text-white/25 px-2 py-1 rounded bg-black/20"
          >
            {watermarkData.name} ({watermarkData.loginId})
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-black select-none group font-sans ${className}`}
    >
      {/* Loading Skeleton */}
      {loading && (
        <div className="absolute inset-0 z-40 bg-slate-900 flex flex-col items-center justify-center text-white gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <span className="text-xs font-semibold text-slate-300">
            Verifying enrollment & loading video stream...
          </span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
          <h3 className="text-base font-bold text-white">Playback Restricted</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">{error}</p>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        preload="metadata"
        playsInline
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) setDuration(videoRef.current.duration || 0);
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (videoRef.current) saveProgress(videoRef.current.duration, true);
        }}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Dynamic Watermark (Anti-Piracy) */}
      {watermarkData && (
        <div
          style={{ top: watermarkPos.top, left: watermarkPos.left }}
          className="absolute pointer-events-none z-30 transition-all duration-1000 select-none text-[11px] font-mono text-white/22 px-2 py-1 rounded bg-black/20"
        >
          {watermarkData.name} ({watermarkData.loginId})
        </div>
      )}

      {/* Big Center Play Button when paused */}
      {!isPlaying && !loading && !error && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer"
        >
          <Play className="w-7 h-7 fill-current ml-1" />
        </button>
      )}

      {/* Custom Video Controls Bar */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity z-30 flex flex-col gap-2">
        {/* Progress Bar */}
        <div
          onClick={handleSeek}
          className="relative h-1.5 w-full bg-white/20 rounded-full cursor-pointer hover:h-2 transition-all"
        >
          <div
            className="absolute top-0 left-0 h-full bg-amber-500 rounded-full"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between text-white text-xs">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1 hover:text-amber-400 transition"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              type="button"
              onClick={() => skip(-10)}
              className="p-1 hover:text-amber-400 transition"
              title="10s Back (←)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => skip(10)}
              className="p-1 hover:text-amber-400 transition"
              title="10s Forward (→)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                className="p-1 hover:text-amber-400 transition"
                title="Mute (m)"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  setIsMuted(false);
                  localStorage.setItem("rd_video_volume", String(v));
                }}
                className="w-16 h-1 accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Time Display */}
            <span className="font-mono text-[11px] text-slate-300 ml-2">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 relative">
            {/* Speed Selector */}
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(Number(e.target.value))}
              className="bg-black/40 border border-white/20 rounded px-1.5 py-0.5 text-[11px] font-bold text-white cursor-pointer"
            >
              {PLAYBACK_RATES.map((rate) => (
                <option key={rate} value={rate} className="bg-slate-900 text-white">
                  {rate}x
                </option>
              ))}
            </select>

            {/* Quality Menu Toggle */}
            {qualities.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSettings((s) => !s)}
                  className="p-1 hover:text-amber-400 transition"
                  title="Quality Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {showSettings && (
                  <div className="absolute right-0 bottom-8 bg-slate-900/95 border border-slate-700 rounded-xl p-2 w-28 shadow-xl text-xs space-y-1 z-50">
                    <button
                      type="button"
                      onClick={() => handleQualityChange(-1)}
                      className={`w-full text-left px-2 py-1 rounded text-[11px] font-bold ${
                        currentQuality === -1 ? "bg-amber-500 text-black" : "text-white hover:bg-slate-800"
                      }`}
                    >
                      Auto
                    </button>
                    {qualities.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => handleQualityChange(q.id)}
                        className={`w-full text-left px-2 py-1 rounded text-[11px] font-bold ${
                          currentQuality === q.id ? "bg-amber-500 text-black" : "text-white hover:bg-slate-800"
                        }`}
                      >
                        {q.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1 hover:text-amber-400 transition"
              title="Fullscreen (f)"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
