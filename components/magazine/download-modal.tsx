"use client";

import { useMemo, useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import JSZip from "jszip";
import type { Event, Photo, PoseBattle } from "@/types/database";
import type { TableScore } from "@/lib/supabase/gamification";

type DownloadModalProps = {
  open: boolean;
  onClose: () => void;
  event: Event;
  photos: Photo[];
  photogenic: TableScore | null;
  triviaLeaders: TableScore[];
  closestBattle: (PoseBattle & { votes_a: number; votes_b: number }) | null;
};

type InfoKey = "meta" | "photogenic" | "trivia" | "pose";

function extFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const match = path.match(/\.([a-zA-Z0-9]+)$/);
    return match?.[1]?.toLowerCase() ?? "jpg";
  } catch {
    return "jpg";
  }
}

export function DownloadModal({
  open,
  onClose,
  event,
  photos,
  photogenic,
  triviaLeaders,
  closestBattle,
}: DownloadModalProps) {
  const [mode, setMode] = useState<"all" | "select">("all");
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(
    () => new Set(photos.map((p) => p.id)),
  );
  const [info, setInfo] = useState<Record<InfoKey, boolean>>({
    meta: true,
    photogenic: true,
    trivia: true,
    pose: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = useMemo(
    () => photos.length > 0 && selectedPhotoIds.size === photos.length,
    [photos.length, selectedPhotoIds.size],
  );

  if (!open) return null;

  function togglePhoto(id: string) {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllPhotos() {
    setSelectedPhotoIds(new Set(photos.map((p) => p.id)));
  }

  function clearPhotos() {
    setSelectedPhotoIds(new Set());
  }

  async function buildAndDownload() {
    setBusy(true);
    setError(null);
    try {
      const photoSet =
        mode === "all"
          ? photos
          : photos.filter((p) => selectedPhotoIds.has(p.id));
      const includeInfo =
        mode === "all"
          ? { meta: true, photogenic: true, trivia: true, pose: true }
          : info;

      if (
        photoSet.length === 0 &&
        !includeInfo.meta &&
        !includeInfo.photogenic &&
        !includeInfo.trivia &&
        !includeInfo.pose
      ) {
        setError("Selecciona al menos fotos o información");
        return;
      }

      const zip = new JSZip();
      const folder = zip.folder("fotos");
      if (!folder) throw new Error("No se pudo crear la carpeta del ZIP");

      for (const photo of photoSet) {
        try {
          const res = await fetch(photo.photo_url);
          if (!res.ok) continue;
          const blob = await res.blob();
          const ext = extFromUrl(photo.photo_url);
          folder.file(
            `mesa-${photo.table_number}-${photo.id.slice(0, 8)}.${ext}`,
            blob,
          );
        } catch {
          // skip failed photo fetches
        }
      }

      const payload: Record<string, unknown> = {};
      const textLines: string[] = [`Álbum: ${event.name}`, `Código: ${event.code}`, ""];

      if (includeInfo.meta) {
        payload.evento = {
          id: event.id,
          name: event.name,
          code: event.code,
          created_at: event.created_at,
          archived_at: event.archived_at,
          album_expires_at: event.album_expires_at,
        };
        textLines.push(
          `Creado: ${event.created_at}`,
          event.archived_at ? `Archivado: ${event.archived_at}` : "",
          event.album_expires_at
            ? `Álbum válido hasta: ${event.album_expires_at}`
            : "",
          "",
        );
      }

      if (includeInfo.photogenic) {
        payload.mesa_mas_fotogenica = photogenic;
        textLines.push(
          photogenic
            ? `Mesa más fotogénica: Mesa ${photogenic.table_number} (${photogenic.score} fotos)`
            : "Mesa más fotogénica: —",
          "",
        );
      }

      if (includeInfo.trivia) {
        payload.ranking_trivia = triviaLeaders;
        textLines.push("Ranking trivia:");
        if (triviaLeaders.length === 0) textLines.push("  (sin datos)");
        else {
          for (const row of triviaLeaders.slice(0, 10)) {
            textLines.push(
              `  Mesa ${row.table_number}: ${row.score} aciertos`,
            );
          }
        }
        textLines.push("");
      }

      if (includeInfo.pose) {
        payload.batalla_mas_cerrada = closestBattle
          ? {
              table_a: closestBattle.table_a,
              table_b: closestBattle.table_b,
              votes_a: closestBattle.votes_a,
              votes_b: closestBattle.votes_b,
              photo_a_url: closestBattle.photo_a_url,
              photo_b_url: closestBattle.photo_b_url,
            }
          : null;
        textLines.push(
          closestBattle
            ? `Batalla más cerrada: Mesa ${closestBattle.table_a} (${closestBattle.votes_a}) vs Mesa ${closestBattle.table_b} (${closestBattle.votes_b})`
            : "Batalla más cerrada: —",
        );
      }

      if (
        includeInfo.meta ||
        includeInfo.photogenic ||
        includeInfo.trivia ||
        includeInfo.pose
      ) {
        zip.file("evento.json", JSON.stringify(payload, null, 2));
        zip.file("resumen.txt", textLines.filter(Boolean).join("\n"));
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lumina-${event.code.toLowerCase()}-album.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar ZIP");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto border border-[#D4AF37]/30 bg-[#12100e] p-5 text-[#f4ead7]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
              Descarga
            </p>
            <h2 className="font-display mt-1 text-2xl text-[#f8f0e3]">
              Llevarse el álbum
            </h2>
            <p className="mt-1 text-sm text-[#f4ead7]/55">
              Elige descargar todo o solo lo que necesites.
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

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("all")}
            className={
              mode === "all"
                ? "border border-[#D4AF37] bg-[#D4AF37]/15 px-3 py-2 text-sm text-[#D4AF37]"
                : "border border-[#D4AF37]/25 px-3 py-2 text-sm text-[#f4ead7]/70"
            }
          >
            Todo
          </button>
          <button
            type="button"
            onClick={() => setMode("select")}
            className={
              mode === "select"
                ? "border border-[#D4AF37] bg-[#D4AF37]/15 px-3 py-2 text-sm text-[#D4AF37]"
                : "border border-[#D4AF37]/25 px-3 py-2 text-sm text-[#f4ead7]/70"
            }
          >
            Seleccionar
          </button>
        </div>

        {mode === "select" ? (
          <div className="mt-5 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-[#f4ead7]/45">
                  Fotos ({selectedPhotoIds.size}/{photos.length})
                </p>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAllPhotos}
                    className="text-[#D4AF37]"
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={clearPhotos}
                    className="text-[#f4ead7]/45"
                  >
                    Ninguna
                  </button>
                </div>
              </div>
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto border border-[#D4AF37]/15 p-2">
                {photos.length === 0 ? (
                  <p className="text-sm text-[#f4ead7]/40">Sin fotos aprobadas</p>
                ) : (
                  photos.map((p) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPhotoIds.has(p.id)}
                        onChange={() => togglePhoto(p.id)}
                      />
                      <span>
                        Mesa {p.table_number} · {p.id.slice(0, 8)}
                      </span>
                    </label>
                  ))
                )}
              </div>
              {!allSelected && mode === "select" ? null : null}
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-[#f4ead7]/45">
                Información
              </p>
              {(
                [
                  ["meta", "Datos del evento"],
                  ["photogenic", "Mesa más fotogénica"],
                  ["trivia", "Ranking trivia"],
                  ["pose", "Batalla más cerrada"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={info[key]}
                    onChange={(e) =>
                      setInfo((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#f4ead7]/55">
            Incluye {photos.length} fotos aprobadas y el resumen del evento
            (trivia, pose battle y metadatos).
          </p>
        )}

        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void buildAndDownload()}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 bg-[#D4AF37] px-4 text-sm font-semibold text-[#1a140c] disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Confirmar descarga
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="min-h-11 border border-[#D4AF37]/30 px-4 text-sm text-[#f4ead7]/70"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
