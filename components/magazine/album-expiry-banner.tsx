"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { fadeIn } from "@/lib/motion";

type AlbumExpiryBannerProps = {
  expiresAt: string;
};

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0 minutos";
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const minutes = totalMin % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} día${days === 1 ? "" : "s"}`);
  if (hours > 0) parts.push(`${hours} h`);
  if (days === 0 && minutes > 0) parts.push(`${minutes} min`);
  if (parts.length === 0) parts.push("menos de 1 min");
  return parts.join(" ");
}

export function AlbumExpiryBanner({ expiresAt }: AlbumExpiryBannerProps) {
  const reduce = useReducedMotion();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const expiresMs = new Date(expiresAt).getTime();
  const remaining = expiresMs - now;
  const urgent = remaining > 0 && remaining < 48 * 60 * 60 * 1000;
  const dateLabel = new Date(expiresAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (remaining <= 0) {
    return (
      <div className="no-print border-b border-red-400/30 bg-red-950/40 px-6 py-3 text-sm text-red-200">
        Este álbum ya caducó.
      </div>
    );
  }

  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={fadeIn}
      className={
        urgent
          ? "no-print border-b border-amber-400/40 bg-amber-950/35 px-6 py-3 text-sm text-amber-100"
          : "no-print border-b border-[#D4AF37]/25 bg-[#12100e] px-6 py-3 text-sm text-[#f4ead7]/80"
      }
    >
      <p className="flex flex-wrap items-center gap-2">
        <Clock className="h-4 w-4 shrink-0 text-[#D4AF37]" />
        <span>
          Tu álbum estará disponible{" "}
          <strong className="font-semibold text-[#f8f0e3]">
            {formatRemaining(remaining)}
          </strong>{" "}
          más · caduca el {dateLabel}
        </span>
      </p>
      <p className="mt-1 text-xs text-[#f4ead7]/45">
        Descarga tus fotos e información antes de que expire el enlace.
      </p>
    </motion.div>
  );
}
