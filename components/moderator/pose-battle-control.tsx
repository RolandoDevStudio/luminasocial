"use client";

import { useMemo, useState } from "react";
import { Loader2, Swords } from "lucide-react";
import { createAndLaunchPoseBattle } from "@/lib/supabase/gamification";
import type { Photo } from "@/types/database";
import { cn } from "@/lib/utils";

type PoseBattleControlProps = {
  eventId: string;
  approvedPhotos: Photo[];
};

export function PoseBattleControl({
  eventId,
  approvedPhotos,
}: PoseBattleControlProps) {
  const [photoAId, setPhotoAId] = useState<string>("");
  const [photoBId, setPhotoBId] = useState<string>("");
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoA = useMemo(
    () => approvedPhotos.find((p) => p.id === photoAId) ?? null,
    [approvedPhotos, photoAId],
  );
  const photoB = useMemo(
    () => approvedPhotos.find((p) => p.id === photoBId) ?? null,
    [approvedPhotos, photoBId],
  );

  async function handleLaunch() {
    if (!photoA || !photoB || launching) return;
    if (photoA.id === photoB.id) {
      setError("Elige dos fotos distintas");
      return;
    }
    setLaunching(true);
    setError(null);
    try {
      await createAndLaunchPoseBattle({
        eventId,
        tableA: photoA.table_number,
        tableB: photoB.table_number,
        photoAUrl: photoA.photo_url,
        photoBUrl: photoB.photo_url,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al lanzar duelo");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <section className="border border-[#D4AF37]/20 bg-[#12100e] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]">
            Pose battle
          </p>
          <h2 className="font-display mt-1 text-xl text-[#f8f0e3]">
            Duelo entre mesas
          </h2>
        </div>
        <button
          type="button"
          disabled={!photoA || !photoB || launching}
          onClick={() => void handleLaunch()}
          className="inline-flex min-h-11 items-center gap-2 bg-[#D4AF37] px-4 text-sm font-semibold text-[#1a140c] disabled:opacity-40"
        >
          {launching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Swords className="h-4 w-4" />
          )}
          Lanzar duelo
        </button>
      </div>

      {approvedPhotos.length < 2 ? (
        <p className="mt-4 text-sm text-[#f4ead7]/45">
          Necesitas al menos 2 fotos aprobadas para un duelo.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {([
            ["A", photoAId, setPhotoAId],
            ["B", photoBId, setPhotoBId],
          ] as const).map(([label, value, setter]) => (
            <div key={label}>
              <p className="mb-2 text-xs uppercase tracking-wider text-[#f4ead7]/45">
                Foto {label}
              </p>
              <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto">
                {approvedPhotos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setter(p.id)}
                    className={cn(
                      "relative aspect-square overflow-hidden border",
                      value === p.id
                        ? "border-[#D4AF37]"
                        : "border-transparent opacity-70 hover:opacity-100",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.photo_url}
                      alt={`Mesa ${p.table_number}`}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center text-[10px]">
                      M{p.table_number}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {photoA && photoB ? (
        <p className="mt-3 text-sm text-[#D4AF37]">
          Mesa {photoA.table_number} vs Mesa {photoB.table_number}
        </p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
