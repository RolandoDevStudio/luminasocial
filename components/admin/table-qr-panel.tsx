"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, Loader2, QrCode, X } from "lucide-react";
import QRCode from "qrcode";
import JSZip from "jszip";
import { motion, useReducedMotion } from "framer-motion";
import type { Event } from "@/types/database";
import { fadeIn, scaleIn } from "@/lib/motion";

type TableQrPanelProps = {
  event: Event;
  onClose: () => void;
};

function guestUrl(origin: string, code: string, table: number) {
  return `${origin}/guest?code=${encodeURIComponent(code)}&table=${table}`;
}

export function TableQrPanel({ event, onClose }: TableQrPanelProps) {
  const reduce = useReducedMotion();
  const count = Math.min(100, Math.max(1, event.table_count ?? 30));
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

  const urls = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const table = i + 1;
        return { table, url: guestUrl(origin, event.code, table) };
      }),
    [count, event.code, origin],
  );

  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [busyZip, setBusyZip] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function build() {
      const next: Record<number, string> = {};
      for (const row of urls) {
        next[row.table] = await QRCode.toDataURL(row.url, {
          margin: 1,
          width: 280,
          color: { dark: "#1a140c", light: "#f8f0e3" },
        });
      }
      if (!cancelled) setPreviews(next);
    }
    void build().catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : "Error generando QR");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [urls]);

  async function copyUrl(table: number, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(table);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      window.prompt("Copia la URL:", url);
    }
  }

  async function downloadZip() {
    setBusyZip(true);
    setError(null);
    try {
      const zip = new JSZip();
      const lines: string[] = [
        `Lumina Social — QR mesas · ${event.name} (${event.code})`,
        "",
      ];

      for (const row of urls) {
        const dataUrl = await QRCode.toDataURL(row.url, {
          margin: 1,
          width: 768,
          color: { dark: "#1a140c", light: "#ffffff" },
        });
        const base64 = dataUrl.split(",")[1] ?? "";
        const pad = String(row.table).padStart(2, "0");
        zip.file(`mesa-${pad}.png`, base64, { base64: true });
        lines.push(`Mesa ${row.table}: ${row.url}`);
      }

      zip.file("urls.txt", lines.join("\n"));
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `lumina-${event.code.toLowerCase()}-qr-mesas.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear ZIP");
    } finally {
      setBusyZip(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-3 sm:items-center"
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={fadeIn}
      role="dialog"
      aria-modal="true"
      aria-label="QR por mesa"
    >
      <motion.div
        variants={scaleIn}
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col border border-[#D4AF37]/30 bg-[#12100e] text-[#f4ead7]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#D4AF37]/20 px-4 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
              QR mesas
            </p>
            <h2 className="font-display mt-1 text-2xl text-[#f8f0e3]">
              {event.name}
            </h2>
            <p className="mt-1 text-xs text-[#f4ead7]/45">
              {count} mesas · /guest?code={event.code}&table=N
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#f4ead7]/50 hover:text-[#D4AF37]"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-[#D4AF37]/15 px-4 py-3">
          <button
            type="button"
            disabled={busyZip}
            onClick={() => void downloadZip()}
            className="inline-flex min-h-11 items-center gap-2 bg-[#D4AF37] px-4 text-sm font-semibold text-[#1a140c] disabled:opacity-50"
          >
            {busyZip ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Descargar ZIP
          </button>
        </div>

        {error ? (
          <p className="px-4 pt-3 text-sm text-red-300">{error}</p>
        ) : null}

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {urls.map((row) => (
            <article
              key={row.table}
              className="flex flex-wrap items-center gap-3 border border-[#D4AF37]/15 p-3"
            >
              <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-[#f8f0e3]">
                {previews[row.table] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previews[row.table]}
                    alt={`QR mesa ${row.table}`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <QrCode className="h-6 w-6 text-[#1a140c]/40" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#f8f0e3]">
                  Mesa {row.table}
                </p>
                <p className="mt-1 break-all text-[11px] text-[#f4ead7]/45">
                  {row.url}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void copyUrl(row.table, row.url)}
                className="inline-flex min-h-10 items-center gap-1.5 border border-[#D4AF37]/35 px-3 text-xs uppercase tracking-wider text-[#D4AF37]"
              >
                {copied === row.table ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied === row.table ? "Copiado" : "Copiar"}
              </button>
            </article>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
