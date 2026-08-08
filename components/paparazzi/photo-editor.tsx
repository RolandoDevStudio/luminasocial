"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Check,
  FlipHorizontal2,
  FlipVertical2,
  Loader2,
  RotateCcw,
  RotateCw,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  DEFAULT_EDITS,
  FILTER_PRESETS,
  type CropRect,
  type FilterId,
  type ImageEdits,
  drawEditedImage,
  exportEditedJpeg,
  loadImageFromSrc,
} from "@/lib/images/edit-image";
import { fadeIn, scaleIn } from "@/lib/motion";

type PhotoEditorProps = {
  imageUrl: string;
  sourceFile: File;
  onApply: (file: File) => void;
  onCancel: () => void;
};

type DragMode = "move" | "nw" | "ne" | "sw" | "se" | null;

type DisplayRect = { left: number; top: number; width: number; height: number };

export function PhotoEditor({
  imageUrl,
  sourceFile,
  onApply,
  onCancel,
}: PhotoEditorProps) {
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [edits, setEdits] = useState<ImageEdits>(DEFAULT_EDITS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [display, setDisplay] = useState<DisplayRect | null>(null);
  const [drag, setDrag] = useState<DragMode>(null);
  const dragOrigin = useRef<{
    x: number;
    y: number;
    crop: CropRect;
  } | null>(null);

  const updateDisplayRect = useCallback(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas || !canvas.width || !canvas.height) {
      setDisplay(null);
      return;
    }
    const stageRect = stage.getBoundingClientRect();
    const scale = Math.min(
      stageRect.width / canvas.width,
      stageRect.height / canvas.height,
    );
    const width = canvas.width * scale;
    const height = canvas.height * scale;
    setDisplay({
      left: (stageRect.width - width) / 2,
      top: (stageRect.height - height) / 2,
      width,
      height,
    });
  }, []);

  const redraw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      if (!imgRef.current) {
        imgRef.current = await loadImageFromSrc(imageUrl);
      }
      drawEditedImage(imgRef.current, edits, canvas, { applyCrop: false });
      updateDisplayRect();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al dibujar");
    }
  }, [edits, imageUrl, updateDisplayRect]);

  useEffect(() => {
    void redraw();
  }, [redraw]);

  useLayoutEffect(() => {
    updateDisplayRect();
    window.addEventListener("resize", updateDisplayRect);
    return () => window.removeEventListener("resize", updateDisplayRect);
  }, [updateDisplayRect]);

  function rotate(dir: 1 | -1) {
    setEdits((prev) => ({
      ...prev,
      rotation: ((((prev.rotation + dir * 90) % 360) + 360) % 360) as
        | 0
        | 90
        | 180
        | 270,
      crop: { x: 0, y: 0, w: 1, h: 1 },
    }));
  }

  function setFilter(filter: FilterId) {
    setEdits((prev) => ({ ...prev, filter }));
  }

  function reset() {
    setEdits(DEFAULT_EDITS);
  }

  function clientToNorm(clientX: number, clientY: number) {
    const stage = stageRef.current;
    if (!stage || !display) return { x: 0, y: 0 };
    const rect = stage.getBoundingClientRect();
    const x = (clientX - rect.left - display.left) / display.width;
    const y = (clientY - rect.top - display.top) / display.height;
    return {
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
    };
  }

  function onPointerDown(mode: DragMode, e: ReactPointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setDrag(mode);
    dragOrigin.current = {
      x: e.clientX,
      y: e.clientY,
      crop: { ...edits.crop },
    };
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!drag || !dragOrigin.current) return;
    const start = clientToNorm(dragOrigin.current.x, dragOrigin.current.y);
    const now = clientToNorm(e.clientX, e.clientY);
    const dx = now.x - start.x;
    const dy = now.y - start.y;
    const c = dragOrigin.current.crop;

    setEdits((prev) => {
      let next: CropRect = { ...c };
      if (drag === "move") {
        next.x = Math.min(1 - c.w, Math.max(0, c.x + dx));
        next.y = Math.min(1 - c.h, Math.max(0, c.y + dy));
      } else if (drag === "se") {
        next.w = Math.min(1 - c.x, Math.max(0.12, c.w + dx));
        next.h = Math.min(1 - c.y, Math.max(0.12, c.h + dy));
      } else if (drag === "nw") {
        const nx = Math.min(c.x + c.w - 0.12, Math.max(0, c.x + dx));
        const ny = Math.min(c.y + c.h - 0.12, Math.max(0, c.y + dy));
        next.w = c.w + (c.x - nx);
        next.h = c.h + (c.y - ny);
        next.x = nx;
        next.y = ny;
      } else if (drag === "ne") {
        const ny = Math.min(c.y + c.h - 0.12, Math.max(0, c.y + dy));
        next.w = Math.min(1 - c.x, Math.max(0.12, c.w + dx));
        next.h = c.h + (c.y - ny);
        next.y = ny;
      } else if (drag === "sw") {
        const nx = Math.min(c.x + c.w - 0.12, Math.max(0, c.x + dx));
        next.w = c.w + (c.x - nx);
        next.h = Math.min(1 - c.y, Math.max(0.12, c.h + dy));
        next.x = nx;
      }
      return { ...prev, crop: next };
    });
  }

  function onPointerUp() {
    setDrag(null);
    dragOrigin.current = null;
  }

  async function apply() {
    setBusy(true);
    setError(null);
    try {
      const file = await exportEditedJpeg(sourceFile, edits);
      onApply(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo aplicar");
    } finally {
      setBusy(false);
    }
  }

  const crop = edits.crop;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-[#080706] text-[#f4ead7]"
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={fadeIn}
      role="dialog"
      aria-modal="true"
      aria-label="Editor de foto"
    >
      <div className="flex items-center justify-between border-b border-[#D4AF37]/20 px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 text-sm text-[#f4ead7]/70"
        >
          <X className="h-4 w-4" />
          Cancelar
        </button>
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
          Editar foto
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void apply()}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#D4AF37] disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Aplicar
        </button>
      </div>

      <motion.div
        variants={scaleIn}
        ref={stageRef}
        className="relative mx-auto min-h-0 w-full max-w-lg flex-1 touch-none bg-black"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <canvas
          ref={canvasRef}
          className="absolute left-1/2 top-1/2 max-h-full max-w-full -translate-x-1/2 -translate-y-1/2"
        />
        {display ? (
          <div
            className="absolute border-2 border-[#D4AF37] shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
            style={{
              left: display.left + crop.x * display.width,
              top: display.top + crop.y * display.height,
              width: crop.w * display.width,
              height: crop.h * display.height,
            }}
            onPointerDown={(e) => onPointerDown("move", e)}
          >
            {(["nw", "ne", "sw", "se"] as const).map((corner) => (
              <button
                key={corner}
                type="button"
                aria-label={`Ajustar esquina ${corner}`}
                className="absolute h-5 w-5 border-2 border-[#D4AF37] bg-[#1a140c]"
                style={{
                  left: corner.includes("w") ? -8 : undefined,
                  right: corner.includes("e") ? -8 : undefined,
                  top: corner.includes("n") ? -8 : undefined,
                  bottom: corner.includes("s") ? -8 : undefined,
                }}
                onPointerDown={(e) => onPointerDown(corner, e)}
              />
            ))}
          </div>
        ) : null}
      </motion.div>

      {error ? (
        <p className="px-4 text-center text-sm text-red-300">{error}</p>
      ) : null}

      <div className="space-y-3 border-t border-[#D4AF37]/20 px-4 py-4">
        <div className="flex flex-wrap justify-center gap-2">
          <ToolBtn label="Girar izq" onClick={() => rotate(-1)}>
            <RotateCcw className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn label="Girar der" onClick={() => rotate(1)}>
            <RotateCw className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            label="Flip H"
            onClick={() => setEdits((p) => ({ ...p, flipX: !p.flipX }))}
          >
            <FlipHorizontal2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            label="Flip V"
            onClick={() => setEdits((p) => ({ ...p, flipY: !p.flipY }))}
          >
            <FlipVertical2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn label="Reset" onClick={reset}>
            Reset
          </ToolBtn>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTER_PRESETS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={
                edits.filter === f.id
                  ? "shrink-0 border border-[#D4AF37] bg-[#D4AF37]/15 px-3 py-2 text-xs text-[#D4AF37]"
                  : "shrink-0 border border-[#D4AF37]/25 px-3 py-2 text-xs text-[#f4ead7]/70"
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ToolBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 border border-[#D4AF37]/35 px-3 text-xs uppercase tracking-wider text-[#D4AF37]"
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
