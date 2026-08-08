"use client";

const TICKER_ITEMS = [
  "¡Bienvenidos a la gala!",
  "Sube tu foto desde el código QR de tu mesa",
  "Próximamente: Trivia en Vivo",
  "Lumina Social · Momentos que brillan",
  "Modera en un clic · Revela en pantalla grande",
];

export function NewsTicker() {
  const line = TICKER_ITEMS.join("  •  ");
  const doubled = `${line}  •  ${line}  •  `;

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 border-t border-[#D4AF37]/25 bg-black/70 backdrop-blur-md">
      <div className="flex items-center gap-4 px-4 py-3">
        <span className="shrink-0 bg-[#D4AF37] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a140c]">
          En vivo
        </span>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className="animate-ticker flex whitespace-nowrap text-sm tracking-wide text-[#f4ead7]/85">
            <span className="pr-8">{doubled}</span>
            <span className="pr-8" aria-hidden>
              {doubled}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
