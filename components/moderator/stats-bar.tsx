"use client";

import type { PhotoStats } from "@/lib/supabase/queries";

type StatsBarProps = {
  stats: PhotoStats;
};

export function StatsBar({ stats }: StatsBarProps) {
  const items = [
    { label: "Pendientes", value: stats.pending, accent: "text-[#D4AF37]" },
    { label: "Aprobadas", value: stats.approved, accent: "text-emerald-400" },
    { label: "Rechazadas", value: stats.rejected, accent: "text-red-300" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="border border-[#D4AF37]/20 bg-[#12100e] px-4 py-3"
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#f4ead7]/45">
            {item.label}
          </p>
          <p className={`font-display mt-1 text-3xl ${item.accent}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
