/** Shared live-round timer synced by started_at ISO timestamp. */

export function getRemainingSeconds(
  startedAt: string,
  durationSec: number,
  nowMs: number = Date.now(),
): number {
  const elapsed = (nowMs - new Date(startedAt).getTime()) / 1000;
  return Math.max(0, Math.ceil(durationSec - elapsed));
}

export function isRoundExpired(
  startedAt: string,
  durationSec: number,
  nowMs: number = Date.now(),
): boolean {
  return getRemainingSeconds(startedAt, durationSec, nowMs) <= 0;
}
