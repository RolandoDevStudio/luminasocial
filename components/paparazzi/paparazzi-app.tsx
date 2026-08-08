"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { useEventContext } from "@/hooks/useEventContext";
import { compressImage } from "@/lib/images/compress-image";
import { uploadEventPhoto } from "@/lib/supabase/queries";
import { CameraCapture } from "@/components/paparazzi/camera-capture";
import { FlashOverlay } from "@/components/paparazzi/flash-overlay";
import { TableSelector } from "@/components/paparazzi/table-selector";
import { Toast } from "@/components/paparazzi/toast";

export function PaparazziApp() {
  const { event, loading, error } = useEventContext();
  const [table, setTable] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">(
    "success",
  );

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearCapture = useCallback(() => {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const onFile = useCallback((next: File) => {
    setFile(next);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(next);
    });
  }, []);

  async function handleSend() {
    if (!event || table == null || !file || sending) return;

    setSending(true);
    try {
      const compressed = await compressImage(file);
      await uploadEventPhoto(compressed, event.id, table);
      setFlash(true);
      window.setTimeout(() => setFlash(false), 500);
      setToastVariant("success");
      setToast("¡Enviado! Listo para la siguiente toma");
      clearCapture();
    } catch (err) {
      setToastVariant("error");
      setToast(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#080706] text-[#D4AF37]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#080706] px-6 text-center text-red-200">
        <p>{error ?? "Evento no disponible"}</p>
      </main>
    );
  }

  const canSend = table != null && !!file && !sending;

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-[#080706] px-4 pb-10 pt-6 text-[#f4ead7]">
      <FlashOverlay show={flash} />
      <Toast message={toast} variant={toastVariant} />

      <header className="mb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#D4AF37]">
          Paparazzi
        </p>
        <h1 className="font-display mt-1 text-3xl text-[#f8f0e3]">
          {event.name}
        </h1>
        <p className="mt-1 text-xs text-[#f4ead7]/50">
          Código <span className="text-[#D4AF37]">{event.code}</span>
        </p>
      </header>

      <div className="space-y-6">
        <TableSelector
          value={table}
          onChange={setTable}
          disabled={sending}
        />

        <CameraCapture
          previewUrl={previewUrl}
          disabled={sending}
          onFile={onFile}
          onClear={clearCapture}
        />

        <button
          type="button"
          disabled={!canSend}
          onClick={() => void handleSend()}
          className="flex w-full min-h-16 items-center justify-center gap-2 bg-[#D4AF37] text-base font-bold uppercase tracking-wider text-[#1a140c] transition enabled:active:scale-[0.98] disabled:opacity-40"
        >
          {sending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Enviar foto
            </>
          )}
        </button>
      </div>
    </main>
  );
}
