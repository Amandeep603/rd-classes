"use client";

import { useEffect, useRef } from "react";
import Watermark from "./Watermark";
import { saveProgressAction } from "@/server/actions/student.progress.actions.js";

export default function VimeoPlayer({
  playerUrl,
  lectureId,
  savedPositionSec = 0,
  studentName,
  loginId,
  onComplete,
}) {
  const iframeRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const lastSavedSecRef = useRef(savedPositionSec);

  useEffect(() => {
    let player = null;
    let isCancelled = false;

    async function initVimeo() {
      if (!iframeRef.current) return;
      try {
        const { default: Vimeo } = await import("@vimeo/player");
        if (isCancelled || !iframeRef.current) return;

        player = new Vimeo(iframeRef.current);
        playerInstanceRef.current = player;

        // Resume playback from saved position if greater than 3 seconds
        if (savedPositionSec > 3) {
          player.setCurrentTime(savedPositionSec).catch(() => {
            // Ignore resume errors if video duration is shorter
          });
        }

        const handleSave = async (pos, dur, force = false) => {
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

        // Progress interval (~15 seconds)
        let lastIntervalSave = 0;
        player.on("timeupdate", (data) => {
          const now = Date.now();
          if (now - lastIntervalSave > 15000) {
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
  }, [lectureId, playerUrl, savedPositionSec, onComplete]);

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#26262B]"
    >
      <iframe
        ref={iframeRef}
        src={playerUrl}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="w-full h-full border-0 absolute inset-0 z-10"
        title="Lecture Player"
      />

      <Watermark studentName={studentName} loginId={loginId} />
    </div>
  );
}
