"use client";

import { useState } from "react";
import { Check, Link2, Printer } from "lucide-react";

type ShareBarProps = {
  eventName: string;
};

export function ShareBar({ eventName }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

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
      `Mira la revista digital de ${eventName}: ${url}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="no-print flex flex-wrap gap-3 px-6 py-6">
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
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        {copied ? "Enlace copiado" : "Copiar enlace"}
      </button>
      <button
        type="button"
        onClick={shareWhatsApp}
        className="inline-flex min-h-11 items-center gap-2 bg-[#D4AF37] px-4 text-sm font-semibold text-[#1a140c]"
      >
        WhatsApp
      </button>
    </div>
  );
}
