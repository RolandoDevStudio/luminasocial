export type FilterId =
  | "original"
  | "bw"
  | "warm"
  | "cool"
  | "contrast"
  | "night";

export type CropRect = {
  /** Normalized 0–1 relative to the oriented image */
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ImageEdits = {
  rotation: 0 | 90 | 180 | 270;
  flipX: boolean;
  flipY: boolean;
  crop: CropRect;
  filter: FilterId;
};

export const DEFAULT_EDITS: ImageEdits = {
  rotation: 0,
  flipX: false,
  flipY: false,
  crop: { x: 0, y: 0, w: 1, h: 1 },
  filter: "original",
};

export const FILTER_PRESETS: { id: FilterId; label: string }[] = [
  { id: "original", label: "Original" },
  { id: "bw", label: "B&N" },
  { id: "warm", label: "Cálido" },
  { id: "cool", label: "Frío" },
  { id: "contrast", label: "Contraste" },
  { id: "night", label: "Luz Extra / Noche" },
];

export function cssFilterFor(filter: FilterId): string {
  switch (filter) {
    case "bw":
      return "grayscale(1) contrast(1.05)";
    case "warm":
      return "sepia(0.28) saturate(1.15) brightness(1.04)";
    case "cool":
      return "saturate(0.9) hue-rotate(195deg) brightness(1.03)";
    case "contrast":
      return "contrast(1.25) saturate(1.05)";
    case "night":
      return "brightness(1.18) contrast(1.12) saturate(1.05)";
    default:
      return "none";
  }
}

export function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return loadImageFromSrc(url).finally(() => URL.revokeObjectURL(url));
}

function orientedSize(
  width: number,
  height: number,
  rotation: ImageEdits["rotation"],
) {
  if (rotation === 90 || rotation === 270) {
    return { width: height, height: width };
  }
  return { width, height };
}

/**
 * Draws the image with rotation/flip/filter onto outCanvas.
 * When `applyCrop` is true, output is cropped; otherwise full oriented frame
 * (for on-screen crop UI).
 */
export function drawEditedImage(
  img: HTMLImageElement,
  edits: ImageEdits,
  outCanvas: HTMLCanvasElement,
  options: { applyCrop?: boolean } = {},
): void {
  const applyCrop = options.applyCrop ?? true;
  const { width: ow, height: oh } = orientedSize(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    edits.rotation,
  );

  const stage = document.createElement("canvas");
  stage.width = ow;
  stage.height = oh;
  const sctx = stage.getContext("2d");
  if (!sctx) throw new Error("Canvas no disponible");

  sctx.save();
  sctx.translate(ow / 2, oh / 2);
  sctx.rotate((edits.rotation * Math.PI) / 180);
  sctx.scale(edits.flipX ? -1 : 1, edits.flipY ? -1 : 1);
  sctx.drawImage(
    img,
    -(img.naturalWidth || img.width) / 2,
    -(img.naturalHeight || img.height) / 2,
  );
  sctx.restore();

  const crop = normalizeCrop(edits.crop);
  const sx = applyCrop ? Math.round(crop.x * ow) : 0;
  const sy = applyCrop ? Math.round(crop.y * oh) : 0;
  const sw = applyCrop ? Math.max(1, Math.round(crop.w * ow)) : ow;
  const sh = applyCrop ? Math.max(1, Math.round(crop.h * oh)) : oh;

  outCanvas.width = sw;
  outCanvas.height = sh;
  const ctx = outCanvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");

  ctx.filter = cssFilterFor(edits.filter);
  ctx.drawImage(stage, sx, sy, sw, sh, 0, 0, sw, sh);
  ctx.filter = "none";
}

function normalizeCrop(crop: CropRect): CropRect {
  const w = Math.min(1, Math.max(0.05, crop.w));
  const h = Math.min(1, Math.max(0.05, crop.h));
  const x = Math.min(1 - w, Math.max(0, crop.x));
  const y = Math.min(1 - h, Math.max(0, crop.y));
  return { x, y, w, h };
}

export async function exportEditedJpeg(
  source: File | string,
  edits: ImageEdits,
  quality = 0.92,
): Promise<File> {
  const img =
    typeof source === "string"
      ? await loadImageFromSrc(source)
      : await loadImageFromFile(source);

  const canvas = document.createElement("canvas");
  drawEditedImage(img, edits, canvas, { applyCrop: true });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("No se pudo exportar"))),
      "image/jpeg",
      quality,
    );
  });

  const base =
    typeof source === "string"
      ? "paparazzi-edit"
      : source.name.replace(/\.[^.]+$/, "") || "paparazzi-edit";

  return new File([blob], `${base}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
