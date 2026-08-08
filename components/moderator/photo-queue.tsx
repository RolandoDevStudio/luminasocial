"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Photo } from "@/types/database";
import { cn } from "@/lib/utils";

type PhotoQueueProps = {
  photos: Photo[];
  focusedId: string | null;
  busyId: string | null;
  onSelectApprove: (photo: Photo) => void;
  onSelectReject: (photo: Photo) => void;
};

export function PhotoQueue({
  photos,
  focusedId,
  busyId,
  onSelectApprove,
  onSelectReject,
}: PhotoQueueProps) {
  if (photos.length === 0) {
    return (
      <div className="border border-dashed border-[#D4AF37]/25 px-6 py-16 text-center text-sm text-[#f4ead7]/45">
        Sin fotos pendientes en esta vista
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence mode="popLayout">
        {photos.map((photo) => {
          const focused = photo.id === focusedId;
          const busy = photo.id === busyId;

          return (
            <motion.article
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{
                opacity: 0,
                scale: 0.9,
                y: -12,
              }}
              transition={{ duration: 0.28 }}
              className={cn(
                "overflow-hidden border bg-[#12100e]",
                focused
                  ? "border-[#D4AF37] shadow-[0_0_28px_rgba(212,175,55,0.35)]"
                  : "border-[#D4AF37]/15",
                busy && "opacity-60",
              )}
            >
              <div className="relative aspect-[3/4] bg-[#0c0b0a]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.photo_url}
                  alt={`Mesa ${photo.table_number}`}
                  className="h-full w-full object-cover"
                />
                {focused ? (
                  <span className="absolute left-2 top-2 bg-[#D4AF37] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1a140c]">
                    En foco
                  </span>
                ) : null}
              </div>
              <div className="space-y-2 p-3">
                <p className="text-sm font-medium text-[#f4ead7]">
                  Mesa {photo.table_number}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[#f4ead7]/40">
                  {new Date(photo.created_at).toLocaleTimeString()}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onSelectReject(photo)}
                    className="flex-1 border border-red-400/30 py-2 text-[11px] font-semibold uppercase tracking-wide text-red-200"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onSelectApprove(photo)}
                    className="flex-1 bg-[#D4AF37] py-2 text-[11px] font-semibold uppercase tracking-wide text-[#1a140c]"
                  >
                    Sí
                  </button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
