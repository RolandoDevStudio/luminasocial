"use client";

import { useEffect, useState } from "react";
import { getRemainingSeconds } from "@/lib/live/round-timer";

export function useSyncedCountdown(
  startedAt: string | null | undefined,
  durationSec: number | null | undefined,
  tickMs = 200,
) {
  const duration = durationSec ?? 0;
  const [remaining, setRemaining] = useState(() =>
    startedAt && duration
      ? getRemainingSeconds(startedAt, duration)
      : 0,
  );

  useEffect(() => {
    if (!startedAt || !duration) {
      setRemaining(0);
      return;
    }

    const update = () => setRemaining(getRemainingSeconds(startedAt, duration));
    update();
    const id = window.setInterval(update, tickMs);
    return () => window.clearInterval(id);
  }, [startedAt, duration, tickMs]);

  const progress =
    duration > 0 ? Math.min(1, Math.max(0, 1 - remaining / duration)) : 1;

  return {
    remaining,
    progress,
    expired: remaining <= 0,
  };
}
