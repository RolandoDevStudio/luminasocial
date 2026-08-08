const MAX_EDGE = 1600;
const TARGET_MIN = 300 * 1024;
const TARGET_MAX = 500 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo comprimir la imagen"));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

/**
 * Compresses an image in-browser to roughly 300–500KB (JPEG).
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo no es una imagen");
  }

  const img = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");

  ctx.drawImage(img, 0, 0, width, height);

  const mime = "image/jpeg";
  let quality = 0.82;
  let blob = await canvasToBlob(canvas, mime, quality);

  // Lower quality until under TARGET_MAX (or quality floor)
  while (blob.size > TARGET_MAX && quality > 0.45) {
    quality -= 0.07;
    blob = await canvasToBlob(canvas, mime, quality);
  }

  // If still tiny and under TARGET_MIN, bump quality a bit (best-effort)
  if (blob.size < TARGET_MIN && quality < 0.92) {
    const bumped = Math.min(0.92, quality + 0.08);
    const candidate = await canvasToBlob(canvas, mime, bumped);
    if (candidate.size <= TARGET_MAX) {
      blob = candidate;
      quality = bumped;
    }
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "capture";
  return new File([blob], `${baseName}.jpg`, {
    type: mime,
    lastModified: Date.now(),
  });
}
