"use client";

import { useEffect, useRef } from "react";
import type { Photo } from "@/types/database";

type UseModerationKeysArgs = {
  focused: Photo | null;
  busy: boolean;
  onApprove: (photo: Photo) => void;
  onReject: (photo: Photo) => void;
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function useModerationKeys({
  focused,
  busy,
  onApprove,
  onReject,
}: UseModerationKeysArgs) {
  const focusedRef = useRef(focused);
  const busyRef = useRef(busy);
  focusedRef.current = focused;
  busyRef.current = busy;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (busyRef.current) return;
      if (isTypingTarget(e.target)) return;

      const photo = focusedRef.current;
      if (!photo) return;

      if (e.code === "Space" || e.key === "ArrowRight") {
        e.preventDefault();
        onApprove(photo);
        return;
      }

      if (
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key === "ArrowLeft"
      ) {
        e.preventDefault();
        onReject(photo);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onApprove, onReject]);
}
