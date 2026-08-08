"use client";

import { Check, X } from "lucide-react";

type ModerationControlsProps = {
  disabled?: boolean;
  onApprove: () => void;
  onReject: () => void;
};

export function ModerationControls({
  disabled,
  onApprove,
  onReject,
}: ModerationControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={onReject}
        className="inline-flex min-h-12 items-center gap-2 border border-red-400/40 px-5 text-sm font-semibold text-red-200 transition hover:bg-red-500/10 disabled:opacity-40"
      >
        <X className="h-4 w-4" />
        Rechazar
        <kbd className="ml-1 hidden text-[10px] uppercase tracking-wider text-red-200/50 sm:inline">
          ← / Del
        </kbd>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onApprove}
        className="inline-flex min-h-12 items-center gap-2 bg-[#D4AF37] px-5 text-sm font-semibold text-[#1a140c] transition hover:brightness-110 disabled:opacity-40"
      >
        <Check className="h-4 w-4" />
        Aprobar
        <kbd className="ml-1 hidden text-[10px] uppercase tracking-wider text-[#1a140c]/55 sm:inline">
          Space / →
        </kbd>
      </button>
    </div>
  );
}
