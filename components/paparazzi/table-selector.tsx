"use client";

import { cn } from "@/lib/utils";

const TABLES = Array.from({ length: 30 }, (_, i) => i + 1);

type TableSelectorProps = {
  value: number | null;
  onChange: (table: number) => void;
  disabled?: boolean;
};

export function TableSelector({
  value,
  onChange,
  disabled,
}: TableSelectorProps) {
  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-[#D4AF37]">
        Mesa
      </p>
      <div className="grid grid-cols-5 gap-2">
        {TABLES.map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange(n)}
              className={cn(
                "min-h-12 rounded-sm text-sm font-semibold transition active:scale-95",
                active
                  ? "bg-[#D4AF37] text-[#1a140c] shadow-[0_0_20px_rgba(212,175,55,0.35)]"
                  : "border border-[#D4AF37]/25 bg-[#12100e] text-[#f4ead7]/80 hover:border-[#D4AF37]/60",
                disabled && "opacity-50",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
