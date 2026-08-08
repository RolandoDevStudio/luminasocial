"use client";

import { useState } from "react";
import { Check, Download, Link2, Printer } from "lucide-react";
import type { Event, Photo, PoseBattle } from "@/types/database";
import type { TableScore } from "@/lib/supabase/gamification";
import { DownloadModal } from "@/components/magazine/download-modal";

type ShareBarProps = {
  eventName: string;
  showDownload?: boolean;
  event?: Event;
  photos?: Photo[];
  photogenic?: TableScore | null;
  triviaLeaders?: TableScore[];
  closestBattle?: (PoseBattle & { votes_a: number; votes_b: number }) | null;
};

export function ShareBar({
  eventName,
  showDownload = false,
  event,
  photos = [],
  photogenic = null,
  triviaLeaders = [],
  closestBattle = null,
}: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  async function copyLink() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia el enlace:", url);
    }
  }

  function shareWhatsApp() {
    const url = window.location.href;
    const text = encodeURIComponent(
      `Mira el álbum digital de ${eventName}: ${url}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <div className="no-print flex flex-wrap gap-3 px-6 py-6">
        {showDownload && event ? (
          <button
            type="button"
            onClick={() => setDownloadOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 bg-[#D4AF37] px-4 text-sm font-semibold text-[#1a140c]"
          >
            <Download className="h-4 w-4" />
            Descargar
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-11 items-center gap-2 border border-[#D4AF37]/40 px-4 text-sm font-medium text-[#D4AF37]"
        >
          <Printer className="h-4 w-4" />
          Imprimir / PDF
        </button>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="inline-flex min-h-11 items-center gap-2 border border-[#D4AF37]/40 px-4 text-sm font-medium text-[#D4AF37]"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          {copied ? "Enlace copiado" : "Copiar enlace"}
        </button>
        <button
          type="button"
          onClick={shareWhatsApp}
          className="inline-flex min-h-11 items-center gap-2 border border-[#D4AF37]/40 px-4 text-sm font-medium text-[#D4AF37]"
        >
          WhatsApp
        </button>
      </div>

      {showDownload && event ? (
        <DownloadModal
          open={downloadOpen}
          onClose={() => setDownloadOpen(false)}
          event={event}
          photos={photos}
          photogenic={photogenic}
          triviaLeaders={triviaLeaders}
          closestBattle={closestBattle}
        />
      ) : null}
    </>
  );
}
