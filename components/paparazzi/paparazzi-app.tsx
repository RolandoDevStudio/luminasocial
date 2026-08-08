"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, RotateCcw, Send } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEventContext } from "@/hooks/useEventContext";
import { compressImage } from "@/lib/images/compress-image";
import { uploadEventPhoto } from "@/lib/supabase/queries";
import { CameraCapture } from "@/components/paparazzi/camera-capture";
import { FlashOverlay } from "@/components/paparazzi/flash-overlay";
import { PhotoEditor } from "@/components/paparazzi/photo-editor";
import { TableSelector } from "@/components/paparazzi/table-selector";
import { Toast } from "@/components/paparazzi/toast";
import { fadeUp, staggerContainer, tapSoft } from "@/lib/motion";

export function PaparazziApp() {
  const reduce = useReducedMotion();
  const { event, loading, error } = useEventContext();
  const [table, setTable] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
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
    setEditorOpen(false);
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const onFile = useCallback((next: File) => {
    setEditorOpen(false);
    setFile(next);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(next);
    });
  }, []);

  const onApplyEdit = useCallback((next: File) => {
    setFile(next);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(next);
    });
    setEditorOpen(false);
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
  const hasPreview = !!previewUrl && !!file;

  return (
    <motion.main
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={staggerContainer}
      className="mx-auto min-h-dvh max-w-md bg-[#080706] px-4 pb-10 pt-6 text-[#f4ead7]"
    >
      <FlashOverlay show={flash} />
      <Toast message={toast} variant={toastVariant} />

      <motion.header variants={fadeUp} className="mb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#D4AF37]">
          Paparazzi
        </p>
        <h1 className="font-display mt-1 text-3xl text-[#f8f0e3]">
          {event.name}
        </h1>
        <p className="mt-1 text-xs text-[#f4ead7]/50">
          Código <span className="text-[#D4AF37]">{event.code}</span>
        </p>
      </motion.header>

      <motion.div variants={fadeUp} className="space-y-6">
        <TableSelector
          value={table}
          onChange={setTable}
          disabled={sending}
          tableCount={event.table_count ?? 30}
        />

        <CameraCapture
          previewUrl={previewUrl}
          disabled={sending}
          hidePreviewChrome={hasPreview}
          onFile={onFile}
          onClear={clearCapture}
        />

        {hasPreview ? (
          <div className="grid grid-cols-3 gap-2">
            <motion.button
              type="button"
              disabled={sending}
              whileTap={reduce || sending ? undefined : tapSoft}
              onClick={() => setEditorOpen(true)}
              className="flex min-h-14 flex-col items-center justify-center gap-1 border border-[#D4AF37]/40 text-xs font-medium uppercase tracking-wider text-[#D4AF37] disabled:opacity-40"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </motion.button>
            <motion.button
              type="button"
              disabled={sending}
              whileTap={reduce || sending ? undefined : tapSoft}
              onClick={clearCapture}
              className="flex min-h-14 flex-col items-center justify-center gap-1 border border-[#D4AF37]/40 text-xs font-medium uppercase tracking-wider text-[#f4ead7]/80 disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              Rehacer
            </motion.button>
            <motion.button
              type="button"
              disabled={!canSend}
              whileTap={reduce || !canSend ? undefined : tapSoft}
              onClick={() => void handleSend()}
              className="flex min-h-14 flex-col items-center justify-center gap-1 bg-[#D4AF37] text-xs font-bold uppercase tracking-wider text-[#1a140c] disabled:opacity-40"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar
            </motion.button>
          </div>
        ) : null}

        {hasPreview && table == null ? (
          <p className="text-center text-xs text-amber-200/80">
            Elige una mesa antes de enviar.
          </p>
        ) : null}
      </motion.div>

      {editorOpen && file && previewUrl ? (
        <PhotoEditor
          imageUrl={previewUrl}
          sourceFile={file}
          onApply={onApplyEdit}
          onCancel={() => setEditorOpen(false)}
        />
      ) : null}
    </motion.main>
  );
}
