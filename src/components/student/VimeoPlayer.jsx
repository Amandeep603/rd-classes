"use client";

import { useEffect, useRef } from "react";
import Watermark from "./Watermark";
import { saveProgressAction } from "@/server/actions/student.progress.actions.js";

export function buildVimeoEmbedUrl(vimeoId, vimeoHash) {
  if (!vimeoId) return "";
  const hashParam = vimeoHash ? `h=${vimeoHash}&` : "";
  return `https://player.vimeo.com/video/${vimeoId}?${hashParam}dnt=1&title=0&byline=0&portrait=0&speed=1`;
}

export default function VimeoPlayer({
  playerUrl,
  vimeoId,
  vimeoHash,
  lectureId,
  savedPositionSec = 0,
  studentName,
  loginId,
  watermarkText,
  enableProgress = true,
  onComplete,
}) {
  const iframeRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const lastSavedSecRef = useRef(savedPositionSec);

  const effectiveUrl =
    playerUrl || (vimeoId ? buildVimeoEmbedUrl(vimeoId, vimeoHash) : "");

  useEffect(() => {
    let player = null;
    let isCancelled = false;

    async function initVimeo() {
      if (!iframeRef.current || !effectiveUrl) return;
      try {
        const { default: Vimeo } = await import("@vimeo/player");
        if (isCancelled || !iframeRef.current) return;

        player = new Vimeo(iframeRef.current);
        playerInstanceRef.current = player;

        // Resume playback from saved position if greater than 2 seconds
        if (savedPositionSec > 2) {
          player.setCurrentTime(savedPositionSec).catch(() => {
            // Ignore resume errors if video duration is shorter
          });
        }

        const handleSave = async (pos, dur, force = false) => {
          if (!enableProgress || !lectureId) return;
          lastSavedSecRef.current = pos;
          try {
            const res = await saveProgressAction({
              lectureId,
              positionSec: Math.floor(pos),
              durationSec: Math.floor(dur),
              forceCompleted: force,
            });
            if (res?.completed && onComplete) {
              onComplete();
            }
          } catch {
            // Progress save errors shouldn't interrupt playback
          }
        };

        // Progress interval: every 10 seconds as required
        let lastIntervalSave = 0;
        player.on("timeupdate", (data) => {
          const now = Date.now();
          if (now - lastIntervalSave >= 10000) {
            lastIntervalSave = now;
            handleSave(data.seconds, data.duration, false);
          }
        });

        player.on("pause", (data) => {
          handleSave(data.seconds, data.duration, false);
        });

        player.on("ended", (data) => {
          handleSave(data.duration, data.duration, true);
        });

        const handleVisibilityChange = () => {
          if (document.visibilityState === "hidden" && playerInstanceRef.current) {
            playerInstanceRef.current
              .getCurrentTime()
              .then((sec) => {
                playerInstanceRef.current.getDuration().then((dur) => {
                  handleSave(sec, dur, false);
                });
              })
              .catch(() => {});
          }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
          document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
      } catch (err) {
        console.error("Vimeo player initialization failed:", err);
      }
    }

    initVimeo();

    return () => {
      isCancelled = true;
      if (player) {
        player.destroy().catch(() => {});
      }
    };
  }, [lectureId, effectiveUrl, savedPositionSec, enableProgress, onComplete]);

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#26262B]"
    >
      <iframe
        ref={iframeRef}
        src={effectiveUrl}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="w-full h-full border-0 absolute inset-0 z-10"
        title="Lecture Player"
      />

      <Watermark
        studentName={studentName}
        loginId={loginId}
        text={watermarkText}
      />
    </div>
  );
}
