"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Head from "next/head";
import { Play } from "lucide-react";
import Watermark from "./Watermark";
import { buildVimeoEmbedUrl } from "@/lib/utils/vimeoParser";

export default function VimeoPlayer({
  playerUrl,
  vimeoId,
  vimeoHash,
  lectureId,
  savedPositionSec = 0,
  durationSeconds = 0,
  studentName,
  loginId,
  watermarkText,
  enableProgress = true,
  onComplete,
  autoPlay = false,
}) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const iframeRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const lastSavedSecRef = useRef(savedPositionSec);
  const hasSyncedDurationRef = useRef(false);

  const effectiveEmbedUrl =
    playerUrl || (vimeoId ? buildVimeoEmbedUrl(vimeoId, vimeoHash) : "");

  // Beacon / Keepalive save helper
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

      if (isComp && onComplete) {
        onComplete();
      }
    },
    [enableProgress, lectureId, onComplete]
  );

  useEffect(() => {
    if (!isPlaying) return;

    let player = null;
    let isCancelled = false;

    async function initVimeo() {
      if (!iframeRef.current || !effectiveEmbedUrl) return;
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
        onContextMenu={(e) => e.preventDefault()}
        className="relative w-full aspect-video bg-[#0A0A0C] rounded-[22px] overflow-hidden shadow-2xl border border-black/10 select-none"
      >
        {!isPlaying ? (
          /* Thumbnail Facade with Play Button */
          <div
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-radial from-[#1A233A] to-[#0A0D18] cursor-pointer group transition-all"
          >
            {/* Glowing yellow play button */}
            <div className="w-20 h-20 rounded-full bg-[#FFC93C] group-hover:bg-[#FDB813] flex items-center justify-center shadow-[0_0_30px_rgba(255,201,60,0.5)] group-hover:scale-105 transition-all active:scale-95">
              <Play className="w-8 h-8 fill-[#0B2A4A] text-[#0B2A4A] ml-1" />
            </div>
            <p className="mt-4 text-xs font-bold text-white/80 group-hover:text-white tracking-wide uppercase">
              Click to Play Lecture
            </p>
          </div>
        ) : (
          /* Single Vimeo Iframe */
          <iframe
            ref={iframeRef}
            src={effectiveEmbedUrl}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0 absolute inset-0 z-10"
            title="RD Classes Lecture Video"
          />
        )}

        <Watermark studentName={studentName} loginId={loginId} text={watermarkText} />
      </div>
    </>
  );
}
