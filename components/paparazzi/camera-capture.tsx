"use client";

import { useRef } from "react";
import { Camera, ImageIcon } from "lucide-react";

type CameraCaptureProps = {
  previewUrl: string | null;
  disabled?: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
};

export function CameraCapture({
  previewUrl,
  disabled,
  onFile,
  onClear,
}: CameraCaptureProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (file) onFile(file);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#D4AF37]">
        Captura
      </p>

      <div className="relative aspect-[3/4] overflow-hidden border border-[#D4AF37]/30 bg-[#0c0b0a]">
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Vista previa"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className="absolute right-3 top-3 border border-[#D4AF37]/50 bg-black/60 px-3 py-1.5 text-xs uppercase tracking-wider text-[#f4ead7]"
            >
              Cambiar
            </button>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-[#f4ead7]/50">
            <Camera className="h-10 w-10 text-[#D4AF37]/70" />
            <p className="text-sm">Toma una foto o elige de la galería</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => cameraRef.current?.click()}
          className="flex min-h-14 items-center justify-center gap-2 border border-[#D4AF37] bg-[#D4AF37] text-sm font-semibold text-[#1a140c] active:scale-[0.98]"
        >
          <Camera className="h-5 w-5" />
          Cámara
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => galleryRef.current?.click()}
          className="flex min-h-14 items-center justify-center gap-2 border border-[#D4AF37]/40 text-sm font-medium text-[#D4AF37] active:scale-[0.98]"
        >
          <ImageIcon className="h-5 w-5" />
          Galería
        </button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleChange(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleChange(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
