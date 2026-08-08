"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  Archive,
  Check,
  Copy,
  ExternalLink,
  LogOut,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  archiveEventAction,
  createEventAction,
  deleteEventAction,
  toggleEventActiveAction,
  updateEventAction,
} from "@/app/(dashboard)/admin/actions";
import type { Event } from "@/types/database";
import { cn } from "@/lib/utils";

type AdminDashboardProps = {
  email: string;
  events: Event[];
  deletedEvents: Event[];
};

export function AdminDashboard({
  email,
  events,
  deletedEvents,
}: AdminDashboardProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [archiveTarget, setArchiveTarget] = useState<Event | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [lastAlbumPath, setLastAlbumPath] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  function absoluteAlbumUrl(path: string) {
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }

  async function copyAlbum(path: string) {
    const url = absoluteAlbumUrl(path);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia el enlace del álbum:", url);
    }
  }

  return (
    <main className="min-h-dvh bg-[#080706] text-[#f4ead7]">
      <header className="border-b border-[#D4AF37]/20 bg-[#0B0C10]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]">
              Lumina Admin
            </p>
            <h1 className="font-display mt-1 text-2xl text-[#f8f0e3]">
              Centro de control
            </h1>
            <p className="mt-1 text-xs text-[#f4ead7]/45">{email}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-2 border border-[#D4AF37]/30 px-4 py-2 text-sm text-[#D4AF37]"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        {message ? (
          <p className="border border-[#D4AF37]/30 bg-[#12100e] px-4 py-3 text-sm text-[#D4AF37]">
            {message}
          </p>
        ) : null}

        {lastAlbumPath ? (
          <div className="border border-emerald-500/30 bg-[#12100e] px-4 py-3 text-sm">
            <p className="text-emerald-300">Álbum listo para el cliente</p>
            <p className="mt-1 break-all text-[#f4ead7]/70">
              {absoluteAlbumUrl(lastAlbumPath)}
            </p>
            <button
              type="button"
              onClick={() => void copyAlbum(lastAlbumPath)}
              className="mt-2 inline-flex items-center gap-1 text-[#D4AF37]"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copiado" : "Copiar URL"}
            </button>
          </div>
        ) : null}

        <section className="border border-[#D4AF37]/20 bg-[#12100e] p-5">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#D4AF37]" />
            <h2 className="font-display text-xl text-[#f8f0e3]">Nuevo evento</h2>
          </div>
          <form
            className="mt-4 grid gap-3 md:grid-cols-[1.4fr_1fr_auto_auto]"
            action={(formData) => {
              startTransition(async () => {
                const res = await createEventAction(formData);
                if (res.error) setMessage(res.error);
                else {
                  setMessage(`Evento creado: ${res.event?.code}`);
                  router.refresh();
                }
              });
            }}
          >
            <input
              name="name"
              required
              placeholder="Nombre del evento"
              className="border border-[#D4AF37]/20 bg-[#0c0b0a] px-3 py-3 text-sm outline-none focus:border-[#D4AF37]"
            />
            <input
              name="code"
              required
              placeholder="CÓDIGO"
              className="border border-[#D4AF37]/20 bg-[#0c0b0a] px-3 py-3 text-sm uppercase outline-none focus:border-[#D4AF37]"
            />
            <label className="flex items-center gap-2 text-sm text-[#f4ead7]/60">
              <input name="is_active" type="checkbox" defaultChecked />
              Activo
            </label>
            <button
              type="submit"
              disabled={pending}
              className="bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-[#1a140c] disabled:opacity-50"
            >
              Crear
            </button>
          </form>
        </section>

        <section>
          <h2 className="font-display text-2xl text-[#f8f0e3]">Eventos</h2>
          <p className="mt-1 text-sm text-[#f4ead7]/45">
            {events.length} registrados · archiva para generar álbum cliente
          </p>

          <div className="mt-6 space-y-4">
            {events.length === 0 ? (
              <p className="border border-dashed border-[#D4AF37]/25 px-4 py-10 text-center text-sm text-[#f4ead7]/40">
                No hay eventos. Crea el primero arriba o ejecuta{" "}
                <code>supabase/seed.sql</code>.
              </p>
            ) : (
              events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  pending={pending}
                  onMessage={setMessage}
                  onRefresh={() => router.refresh()}
                  onArchive={() => setArchiveTarget(event)}
                  onDelete={() => setDeleteTarget(event)}
                  onCopyAlbum={
                    event.album_token
                      ? () => void copyAlbum(`/magazine/${event.album_token}`)
                      : undefined
                  }
                  startTransition={startTransition}
                />
              ))
            )}
          </div>
        </section>

        {deletedEvents.length > 0 ? (
          <section>
            <h2 className="font-display text-xl text-[#f8f0e3]">
              Eliminados (álbum activo)
            </h2>
            <p className="mt-1 text-sm text-[#f4ead7]/45">
              Soft-delete: imágenes y álbum conservados hasta caducar
            </p>
            <div className="mt-4 space-y-3">
              {deletedEvents.map((event) => (
                <article
                  key={event.id}
                  className="border border-[#D4AF37]/10 bg-[#0e0d0c] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]/70">
                        {event.code}
                      </p>
                      <h3 className="font-display text-lg text-[#f8f0e3]/90">
                        {event.name}
                      </h3>
                      {event.album_expires_at ? (
                        <p className="mt-1 text-xs text-[#f4ead7]/40">
                          Álbum hasta{" "}
                          {new Date(event.album_expires_at).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {event.album_token ? (
                        <>
                          <QuickLink
                            href={`/magazine/${event.album_token}`}
                            label="Álbum"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              void copyAlbum(`/magazine/${event.album_token}`)
                            }
                            className="border border-[#D4AF37]/25 px-2.5 py-1.5 text-[11px] uppercase tracking-wider text-[#D4AF37]"
                          >
                            Copiar URL
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setDeleteTarget(event)}
                        className="inline-flex items-center gap-1 border border-red-400/30 px-2.5 py-1.5 text-[11px] uppercase tracking-wider text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                        Borrar todo
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {archiveTarget ? (
        <ArchiveModal
          event={archiveTarget}
          pending={pending}
          onClose={() => setArchiveTarget(null)}
          onConfirm={(days) => {
            startTransition(async () => {
              const fd = new FormData();
              fd.set("id", archiveTarget.id);
              fd.set("days", String(days));
              const res = await archiveEventAction(fd);
              if (res.error) {
                setMessage(res.error);
                return;
              }
              setLastAlbumPath(res.albumUrlPath ?? null);
              setMessage(
                `Evento ${archiveTarget.code} archivado. Comparte el álbum con el cliente.`,
              );
              setArchiveTarget(null);
              router.refresh();
            });
          }}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteModal
          event={deleteTarget}
          pending={pending}
          onClose={() => setDeleteTarget(null)}
          onConfirm={(mode, days) => {
            startTransition(async () => {
              const fd = new FormData();
              fd.set("id", deleteTarget.id);
              fd.set("mode", mode);
              fd.set("days", String(days));
              const res = await deleteEventAction(fd);
              if (res.error) {
                setMessage(res.error);
                return;
              }
              if (res.mode === "keep_images") {
                setLastAlbumPath(res.albumUrlPath ?? null);
                setMessage(
                  `Evento ${deleteTarget.code} eliminado; imágenes y álbum conservados.`,
                );
              } else {
                setLastAlbumPath(null);
                setMessage(`Evento ${deleteTarget.code} borrado por completo.`);
              }
              setDeleteTarget(null);
              router.refresh();
            });
          }}
        />
      ) : null}
    </main>
  );
}

function EventCard({
  event,
  pending,
  onMessage,
  onRefresh,
  onArchive,
  onDelete,
  onCopyAlbum,
  startTransition,
}: {
  event: Event;
  pending: boolean;
  onMessage: (m: string) => void;
  onRefresh: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onCopyAlbum?: () => void;
  startTransition: (cb: () => void) => void;
}) {
  const albumHref = event.album_token
    ? `/magazine/${event.album_token}`
    : `/magazine/${event.id}`;
  const liveDisabled = Boolean(event.archived_at);

  return (
    <article className="border border-[#D4AF37]/15 bg-[#12100e] p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]">
            {event.code}
          </p>
          <h3 className="font-display mt-1 text-xl text-[#f8f0e3]">
            {event.name}
          </h3>
          <p className="mt-1 text-xs text-[#f4ead7]/40">id {event.id}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={cn(
                "inline-block text-[10px] font-semibold uppercase tracking-wider",
                event.is_active ? "text-emerald-400" : "text-red-300",
              )}
            >
              {event.is_active ? "Activo" : "Inactivo"}
            </span>
            {event.archived_at ? (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]">
                Archivado
                {event.album_expires_at
                  ? ` · álbum hasta ${new Date(event.album_expires_at).toLocaleDateString()}`
                  : ""}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!liveDisabled ? (
            <>
              <QuickLink href={`/moderator?code=${event.code}`} label="Moderador" />
              <QuickLink href={`/paparazzi?code=${event.code}`} label="Paparazzi" />
              <QuickLink href={`/screen?code=${event.code}`} label="Pantalla" />
              <QuickLink href={`/guest?code=${event.code}`} label="Invitado" />
            </>
          ) : null}
          <QuickLink
            href={albumHref}
            label={event.album_token ? "Álbum cliente" : "Revista"}
          />
          {onCopyAlbum ? (
            <button
              type="button"
              onClick={onCopyAlbum}
              className="inline-flex items-center gap-1 border border-[#D4AF37]/25 px-2.5 py-1.5 text-[11px] uppercase tracking-wider text-[#D4AF37]/90"
            >
              <Copy className="h-3 w-3" />
              Copiar álbum
            </button>
          ) : null}
        </div>
      </div>

      <form
        className="mt-4 grid gap-2 md:grid-cols-[1.4fr_1fr_auto]"
        action={(formData) => {
          startTransition(async () => {
            const res = await updateEventAction(formData);
            onMessage(res.error ?? `Evento ${event.code} actualizado`);
            onRefresh();
          });
        }}
      >
        <input type="hidden" name="id" value={event.id} />
        <input
          name="name"
          defaultValue={event.name}
          className="border border-[#D4AF37]/20 bg-[#0c0b0a] px-3 py-2 text-sm outline-none focus:border-[#D4AF37]"
        />
        <input
          name="code"
          defaultValue={event.code}
          className="border border-[#D4AF37]/20 bg-[#0c0b0a] px-3 py-2 text-sm uppercase outline-none focus:border-[#D4AF37]"
        />
        <button
          type="submit"
          disabled={pending}
          className="border border-[#D4AF37]/40 px-3 py-2 text-sm text-[#D4AF37] disabled:opacity-50"
        >
          Guardar
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {!liveDisabled ? (
          <form
            action={(formData) => {
              startTransition(async () => {
                const res = await toggleEventActiveAction(formData);
                onMessage(
                  res.error ??
                    (event.is_active
                      ? "Evento desactivado"
                      : "Evento activado"),
                );
                onRefresh();
              });
            }}
          >
            <input type="hidden" name="id" value={event.id} />
            <input
              type="hidden"
              name="is_active"
              value={String(event.is_active)}
            />
            <button
              type="submit"
              disabled={pending}
              className="text-xs uppercase tracking-wider text-[#f4ead7]/50 hover:text-[#D4AF37]"
            >
              {event.is_active ? "Desactivar" : "Activar"}
            </button>
          </form>
        ) : null}

        <button
          type="button"
          disabled={pending}
          onClick={onArchive}
          className="inline-flex items-center gap-1.5 border border-[#D4AF37]/40 px-3 py-1.5 text-xs uppercase tracking-wider text-[#D4AF37] disabled:opacity-50"
        >
          <Archive className="h-3.5 w-3.5" />
          {event.archived_at ? "Regenerar álbum" : "Archivar / Generar álbum"}
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 border border-red-400/35 px-3 py-1.5 text-xs uppercase tracking-wider text-red-300 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar evento
        </button>
      </div>
    </article>
  );
}

function ArchiveModal({
  event,
  pending,
  onClose,
  onConfirm,
}: {
  event: Event;
  pending: boolean;
  onClose: () => void;
  onConfirm: (days: number) => void;
}) {
  const [days, setDays] = useState(30);

  return (
    <ModalShell onClose={onClose} title="Archivar evento">
      <p className="text-sm text-[#f4ead7]/60">
        Se desactiva la operación en vivo y se genera una URL única del álbum
        para <strong className="text-[#f4ead7]">{event.name}</strong>.
      </p>
      <label className="mt-4 block">
        <span className="text-xs uppercase tracking-wider text-[#f4ead7]/45">
          Días que el álbum estará disponible
        </span>
        <input
          type="number"
          min={1}
          max={3650}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="mt-1.5 w-full border border-[#D4AF37]/25 bg-[#0c0b0a] px-3 py-2 text-sm outline-none focus:border-[#D4AF37]"
        />
      </label>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || !days || days < 1}
          onClick={() => onConfirm(days)}
          className="bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-[#1a140c] disabled:opacity-50"
        >
          Confirmar archivo
        </button>
        <button
          type="button"
          onClick={onClose}
          className="border border-[#D4AF37]/30 px-4 py-2.5 text-sm text-[#f4ead7]/70"
        >
          Cancelar
        </button>
      </div>
    </ModalShell>
  );
}

function DeleteModal({
  event,
  pending,
  onClose,
  onConfirm,
}: {
  event: Event;
  pending: boolean;
  onClose: () => void;
  onConfirm: (mode: "keep_images" | "purge", days: number) => void;
}) {
  const [mode, setMode] = useState<"keep_images" | "purge">("keep_images");
  const [days, setDays] = useState(30);
  const alreadyDeleted = Boolean(event.deleted_at);

  return (
    <ModalShell onClose={onClose} title="Eliminar evento">
      <p className="text-sm text-red-200/80">
        Esta acción afecta a{" "}
        <strong className="text-red-100">{event.name}</strong>. Elige con
        cuidado.
      </p>

      {!alreadyDeleted ? (
        <div className="mt-4 space-y-2">
          <label className="flex cursor-pointer gap-2 border border-[#D4AF37]/20 p-3 text-sm">
            <input
              type="radio"
              name="delete-mode"
              checked={mode === "keep_images"}
              onChange={() => setMode("keep_images")}
            />
            <span>
              <span className="font-medium text-[#f8f0e3]">
                Conservar imágenes
              </span>
              <span className="mt-0.5 block text-[#f4ead7]/50">
                El evento sale de operación; se mantiene el álbum y las fotos.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer gap-2 border border-red-400/25 p-3 text-sm">
            <input
              type="radio"
              name="delete-mode"
              checked={mode === "purge"}
              onChange={() => setMode("purge")}
            />
            <span>
              <span className="font-medium text-red-200">Borrar todo</span>
              <span className="mt-0.5 block text-[#f4ead7]/50">
                Elimina evento, datos y archivos de Storage. Irreversible.
              </span>
            </span>
          </label>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#f4ead7]/55">
          Este evento ya está en soft-delete. Solo puedes borrarlo por completo
          (incluye Storage).
        </p>
      )}

      {mode === "keep_images" && !event.album_token && !alreadyDeleted ? (
        <label className="mt-4 block">
          <span className="text-xs uppercase tracking-wider text-[#f4ead7]/45">
            Días del álbum (si aún no existe)
          </span>
          <input
            type="number"
            min={1}
            max={3650}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-1.5 w-full border border-[#D4AF37]/25 bg-[#0c0b0a] px-3 py-2 text-sm outline-none focus:border-[#D4AF37]"
          />
        </label>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            onConfirm(alreadyDeleted ? "purge" : mode, days)
          }
          className="bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {alreadyDeleted || mode === "purge"
            ? "Borrar definitivamente"
            : "Confirmar eliminación"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="border border-[#D4AF37]/30 px-4 py-2.5 text-sm text-[#f4ead7]/70"
        >
          Cancelar
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md border border-[#D4AF37]/30 bg-[#12100e] p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
              Admin
            </p>
            <h2 className="font-display mt-1 text-2xl text-[#f8f0e3]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#f4ead7]/50 hover:text-[#D4AF37]"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 border border-[#D4AF37]/25 px-2.5 py-1.5 text-[11px] uppercase tracking-wider text-[#D4AF37]/90 hover:border-[#D4AF37]"
    >
      {label}
      <ExternalLink className="h-3 w-3" />
    </Link>
  );
}
