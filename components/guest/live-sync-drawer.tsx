"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Json, ScreenViewType } from "@/types/database";
import { LiveDisplayView } from "@/components/screen/live-display-view";

type LiveSyncDrawerProps = {
  view: ScreenViewType;
  payload: Json;
  eventName?: string;
  connected: boolean;
};

export function LiveSyncDrawer({
  view,
  payload,
  eventName,
  connected,
}: LiveSyncDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-40 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-black/70 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f4ead7] backdrop-blur-md"
      >
        <span
          className="animate-live-pulse h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
          aria-hidden
        />
        En vivo en pantalla
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar"
              className="fixed inset-0 z-50 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Vista en vivo"
              className="fixed inset-x-0 bottom-0 z-50 max-h-[78dvh] overflow-hidden rounded-t-2xl border border-[#D4AF37]/25 bg-[#0B0C10] shadow-[0_-20px_60px_rgba(0,0,0,0.55)]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
            >
              <div className="flex items-center justify-between border-b border-[#D4AF37]/15 px-4 py-3">
                <div>
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                    <span className="animate-live-pulse h-2 w-2 rounded-full bg-red-500" />
                    Espejo en vivo
                  </p>
                  <p className="mt-0.5 text-xs text-[#f4ead7]/45">
                    {connected ? "Sincronizado" : "Reconectando…"} · {view}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-[#D4AF37]/25 p-2 text-[#f4ead7]/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative h-[52dvh] min-h-[280px]">
                <LiveDisplayView
                  view={view}
                  payload={payload}
                  variant="mirror"
                  eventName={eventName}
                />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
