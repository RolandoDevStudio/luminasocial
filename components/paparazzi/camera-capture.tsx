"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Flashlight,
  FlashlightOff,
  ImageIcon,
  Loader2,
  RefreshCw,
  SwitchCamera,
  Timer,
} from "lucide-react";

type CameraCaptureProps = {
  previewUrl: string | null;
  disabled?: boolean;
  hidePreviewChrome?: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
};

type Facing = "environment" | "user";
type TimerMode = 0 | 3 | 5;

type TorchCapableTrack = MediaStreamTrack & {
  getCapabilities?: () => MediaTrackCapabilities & { torch?: boolean };
};

function isMobileLike(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}

async function setTorch(track: MediaStreamTrack | null, on: boolean) {
  if (!track) return;
  try {
    await track.applyConstraints({
      // @ts-expect-error torch is a non-standard constraint supported on many mobile browsers
      advanced: [{ torch: on }],
    });
  } catch {
    // ignore unsupported apply
  }
}

function trackSupportsTorch(track: MediaStreamTrack | null): boolean {
  if (!track) return false;
  const t = track as TorchCapableTrack;
  try {
    const caps = t.getCapabilities?.();
    return Boolean(caps && "torch" in caps && caps.torch);
  } catch {
    return false;
  }
}

export function CameraCapture({
  previewUrl,
  disabled,
  hidePreviewChrome = false,
  onFile,
  onClear,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const fallbackCameraRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  const [facing, setFacing] = useState<Facing>(
    isMobileLike() ? "environment" : "user",
  );
  const [live, setLive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [canFlip, setCanFlip] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [timerMode, setTimerMode] = useState<TimerMode>(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  const mirrorPreview = facing === "user" && live && !previewUrl;

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCountdown(null);
  }, []);

  const attachStream = useCallback(async (nextFacing: Facing) => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setUseFallback(true);
      setCameraError(
        "Este navegador no permite cámara en vivo. Usa los archivos.",
      );
      return;
    }

    if (
      typeof window !== "undefined" &&
      !window.isSecureContext &&
      window.location.hostname !== "localhost"
    ) {
      setUseFallback(true);
      setCameraError(
        "Se necesita HTTPS para usar la cámara. Usa Galería o archivo.",
      );
      return;
    }

    setStarting(true);
    setCameraError(null);
    setTorchOn(false);
    setTorchSupported(false);

    try {
      await setTorch(videoTrackRef.current, false);
      stopStream(streamRef.current);
      streamRef.current = null;
      videoTrackRef.current = null;

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: isMobileLike()
          ? {
              facingMode: { ideal: nextFacing },
              width: { ideal: 1280 },
              height: { ideal: 1920 },
            }
          : {
              facingMode: nextFacing,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0] ?? null;
      videoTrackRef.current = track;
      setTorchSupported(trackSupportsTorch(track));

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
      }
      setLive(true);
      setUseFallback(false);

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setCanFlip(devices.filter((d) => d.kind === "videoinput").length > 1);
      } catch {
        setCanFlip(isMobileLike());
      }
    } catch (err) {
      stopStream(streamRef.current);
      streamRef.current = null;
      videoTrackRef.current = null;
      setLive(false);
      setUseFallback(true);
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setCameraError(
          "Permiso de cámara denegado. Actívalo en el navegador o usa Galería.",
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setCameraError("No se encontró cámara. Usa Galería.");
      } else {
        setCameraError(
          err instanceof Error
            ? err.message
            : "No se pudo abrir la cámara. Usa Galería.",
        );
      }
    } finally {
      setStarting(false);
    }
  }, []);

  useEffect(() => {
    if (previewUrl) {
      clearTimer();
      void setTorch(videoTrackRef.current, false);
      setTorchOn(false);
      stopStream(streamRef.current);
      streamRef.current = null;
      videoTrackRef.current = null;
      setLive(false);
      return;
    }

    void attachStream(facing);

    return () => {
      clearTimer();
      void setTorch(videoTrackRef.current, false);
      stopStream(streamRef.current);
      streamRef.current = null;
      videoTrackRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when leaving preview
  }, [previewUrl]);

  async function flipCamera() {
    clearTimer();
    await setTorch(videoTrackRef.current, false);
    setTorchOn(false);
    const next: Facing = facing === "environment" ? "user" : "environment";
    setFacing(next);
    await attachStream(next);
  }

  async function toggleTorch() {
    const track = videoTrackRef.current;
    if (!track || !torchSupported) return;
    const next = !torchOn;
    await setTorch(track, next);
    setTorchOn(next);
  }

  function captureFromVideo() {
    const video = videoRef.current;
    if (!video || !live || video.videoWidth === 0) {
      setCameraError("La cámara aún no está lista");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror front camera so saved photo matches what the operator saw
    if (facing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("No se pudo capturar la foto");
          return;
        }
        const file = new File([blob], `paparazzi-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        void setTorch(videoTrackRef.current, false);
        setTorchOn(false);
        stopStream(streamRef.current);
        streamRef.current = null;
        videoTrackRef.current = null;
        setLive(false);
        onFile(file);
      },
      "image/jpeg",
      0.92,
    );
  }

  function startCapture() {
    if (disabled || starting || !live) return;
    clearTimer();
    if (timerMode === 0) {
      captureFromVideo();
      return;
    }

    let left = timerMode;
    setCountdown(left);
    timerRef.current = window.setInterval(() => {
      left -= 1;
      if (left <= 0) {
        clearTimer();
        captureFromVideo();
      } else {
        setCountdown(left);
      }
    }, 1000);
  }

  function handleFileList(fileList: FileList | null) {
    const file = fileList?.[0];
    if (file) onFile(file);
  }

  function cycleTimer() {
    setTimerMode((prev) => (prev === 0 ? 3 : prev === 3 ? 5 : 0));
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
            {!hidePreviewChrome ? (
              <button
                type="button"
                onClick={onClear}
                disabled={disabled}
                className="absolute right-3 top-3 border border-[#D4AF37]/50 bg-black/60 px-3 py-1.5 text-xs uppercase tracking-wider text-[#f4ead7]"
              >
                Cambiar
              </button>
            ) : null}
          </>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={
                live
                  ? `h-full w-full object-cover ${mirrorPreview ? "-scale-x-100" : ""}`
                  : "pointer-events-none absolute h-0 w-0 opacity-0"
              }
            />
            {countdown != null ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                <p className="font-display text-7xl text-[#D4AF37]">{countdown}</p>
              </div>
            ) : null}
            {!live ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-[#f4ead7]/50">
                {starting ? (
                  <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
                ) : (
                  <Camera className="h-10 w-10 text-[#D4AF37]/70" />
                )}
                <p className="text-sm">
                  {starting
                    ? "Abriendo cámara…"
                    : "Activa la cámara o elige de la galería"}
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>

      {cameraError ? (
        <p className="text-xs text-amber-200/90">{cameraError}</p>
      ) : null}

      {previewUrl ? null : useFallback ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => fallbackCameraRef.current?.click()}
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
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled || starting}
              onClick={cycleTimer}
              className="inline-flex min-h-11 items-center gap-1.5 border border-[#D4AF37]/35 px-3 text-xs uppercase tracking-wider text-[#D4AF37] disabled:opacity-40"
            >
              <Timer className="h-4 w-4" />
              {timerMode === 0 ? "Timer off" : `${timerMode}s`}
            </button>
            {torchSupported ? (
              <button
                type="button"
                disabled={disabled || starting || !live}
                onClick={() => void toggleTorch()}
                className="inline-flex min-h-11 items-center gap-1.5 border border-[#D4AF37]/35 px-3 text-xs uppercase tracking-wider text-[#D4AF37] disabled:opacity-40"
              >
                {torchOn ? (
                  <Flashlight className="h-4 w-4" />
                ) : (
                  <FlashlightOff className="h-4 w-4" />
                )}
                {torchOn ? "Linterna on" : "Linterna"}
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              type="button"
              disabled={disabled || starting || !live || countdown != null}
              onClick={startCapture}
              className="col-span-2 flex min-h-14 items-center justify-center gap-2 border border-[#D4AF37] bg-[#D4AF37] text-sm font-semibold text-[#1a140c] active:scale-[0.98] disabled:opacity-50 sm:col-span-1"
            >
              <Camera className="h-5 w-5" />
              Capturar
            </button>
            <button
              type="button"
              disabled={disabled || starting || !canFlip || countdown != null}
              onClick={() => void flipCamera()}
              className="flex min-h-14 items-center justify-center gap-2 border border-[#D4AF37]/40 text-sm font-medium text-[#D4AF37] active:scale-[0.98] disabled:opacity-40"
            >
              <SwitchCamera className="h-5 w-5" />
              Cambiar
            </button>
            <button
              type="button"
              disabled={disabled || countdown != null}
              onClick={() => galleryRef.current?.click()}
              className="flex min-h-14 items-center justify-center gap-2 border border-[#D4AF37]/40 text-sm font-medium text-[#D4AF37] active:scale-[0.98]"
            >
              <ImageIcon className="h-5 w-5" />
              Galería
            </button>
            {!live && !starting ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => void attachStream(facing)}
                className="col-span-2 flex min-h-12 items-center justify-center gap-2 text-xs uppercase tracking-wider text-[#f4ead7]/50 sm:col-span-3"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reintentar cámara
              </button>
            ) : null}
          </div>
        </div>
      )}

      <input
        ref={fallbackCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFileList(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFileList(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
