"use client";

import { useCallback, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEventContext } from "@/hooks/useEventContext";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { useModerationKeys } from "@/hooks/useModerationKeys";
import { usePhotosRealtime } from "@/hooks/usePhotosRealtime";
import { playApproveSound, playRejectSound } from "@/lib/audio/moderation-sounds";
import {
  computePhotoStats,
  updateLiveState,
  updatePhotoStatus,
} from "@/lib/supabase/queries";
import type { Photo } from "@/types/database";
import { ModerationControls } from "@/components/moderator/moderation-controls";
import { PhotoQueue } from "@/components/moderator/photo-queue";
import { PoseBattleControl } from "@/components/moderator/pose-battle-control";
import { StatsBar } from "@/components/moderator/stats-bar";
import { TableFilter } from "@/components/moderator/table-filter";
import { TriviaControl } from "@/components/moderator/trivia-control";

export function ModeratorConsole() {
  const reduce = useReducedMotion();
  const { event, loading: eventLoading, error: eventError } = useEventContext();
  const {
    photos,
    setPhotos,
    loading: photosLoading,
    error: photosError,
  } = usePhotosRealtime(event?.id ?? null);

  const [tableFilter, setTableFilter] = useState<number | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const stats = useMemo(() => computePhotoStats(photos), [photos]);

  const approvedPhotos = useMemo(
    () => photos.filter((p) => p.status === "approved"),
    [photos],
  );

  const tables = useMemo(() => {
    const set = new Set(photos.map((p) => p.table_number));
    return Array.from(set).sort((a, b) => a - b);
  }, [photos]);

  const pendingQueue = useMemo(() => {
    return photos
      .filter((p) => p.status === "pending")
      .filter((p) =>
        tableFilter === "all" ? true : p.table_number === tableFilter,
      )
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
  }, [photos, tableFilter]);

  const focused = pendingQueue[0] ?? null;

  const moderate = useCallback(
    async (photo: Photo, status: "approved" | "rejected") => {
      if (busyId) return;
      setBusyId(photo.id);

      try {
        const updated = await updatePhotoStatus(photo.id, status);
        setPhotos((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p)),
        );

        if (status === "approved" && event) {
          await updateLiveState(event.id, "PHOTO", {
            photo_id: updated.id,
            photo_url: updated.photo_url,
            table_number: updated.table_number,
          });
          playApproveSound();
        } else {
          playRejectSound();
        }
      } catch (err) {
        console.error(err);
        window.alert(
          err instanceof Error ? err.message : "Error al moderar la foto",
        );
      } finally {
        setBusyId(null);
      }
    },
    [busyId, event, setPhotos],
  );

  const onApprove = useCallback(
    (photo: Photo) => {
      void moderate(photo, "approved");
    },
    [moderate],
  );

  const onReject = useCallback(
    (photo: Photo) => {
      void moderate(photo, "rejected");
    },
    [moderate],
  );

  useModerationKeys({
    focused,
    busy: !!busyId,
    onApprove,
    onReject,
  });

  if (eventLoading || photosLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#080706] text-[#D4AF37]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  if (eventError || !event) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#080706] px-6 text-center text-red-200">
        <p>{eventError ?? "Evento no disponible"}</p>
      </main>
    );
  }

  return (
    <motion.main
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={staggerContainer}
      className="min-h-dvh bg-[#080706] text-[#f4ead7]"
    >
      <div className="mx-auto max-w-7xl px-6 py-8">
        <motion.header
          variants={fadeUp}
          className="mb-8 flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#D4AF37]">
              One-Click Moderation
            </p>
            <h1 className="font-display mt-2 text-4xl text-[#f8f0e3]">
              {event.name}
            </h1>
            <p className="mt-1 text-sm text-[#f4ead7]/50">
              Código <span className="text-[#D4AF37]">{event.code}</span>
              {" · "}
              Space aprueba · ← rechaza
            </p>
          </div>
          <ModerationControls
            disabled={!focused || !!busyId}
            onApprove={() => focused && onApprove(focused)}
            onReject={() => focused && onReject(focused)}
          />
        </motion.header>

        <motion.div variants={fadeUp} className="mb-6 space-y-4">
          <StatsBar stats={stats} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TableFilter
              value={tableFilter}
              onChange={setTableFilter}
              tables={tables}
            />
            {photosError ? (
              <p className="text-sm text-red-300">{photosError}</p>
            ) : (
              <p className="text-xs uppercase tracking-[0.18em] text-[#f4ead7]/40">
                Realtime activo · {pendingQueue.length} en cola
              </p>
            )}
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <PhotoQueue
            photos={pendingQueue}
            focusedId={focused?.id ?? null}
            busyId={busyId}
            onSelectApprove={onApprove}
            onSelectReject={onReject}
          />
        </motion.div>

        <motion.div variants={fadeUp} className="mt-8 grid gap-4 lg:grid-cols-2">
          <TriviaControl eventId={event.id} />
          <PoseBattleControl
            eventId={event.id}
            approvedPhotos={approvedPhotos}
          />
        </motion.div>
      </div>
    </motion.main>
  );
}
