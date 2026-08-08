"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin/auth";
import {
  archiveEvent,
  createEvent,
  ensureAlbumToken,
  purgeEvent,
  softDeleteEvent,
  updateEvent,
} from "@/lib/admin/events";

export async function createEventAction(formData: FormData) {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "");
  const isActive = formData.get("is_active") === "on";

  if (!name.trim() || !code.trim()) {
    return { error: "Nombre y código son obligatorios" };
  }

  try {
    const event = await createEvent({ name, code, is_active: isActive });
    revalidatePath("/admin");
    return { ok: true as const, event };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al crear evento",
    };
  }
}

export async function toggleEventActiveAction(formData: FormData) {
  await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("is_active") === "true";

  if (!id) return { error: "ID inválido" };

  try {
    await updateEvent(id, { is_active: !isActive });
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al actualizar",
    };
  }
}

export async function updateEventAction(formData: FormData) {
  await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");
  const code = String(formData.get("code") ?? "");

  if (!id || !name.trim() || !code.trim()) {
    return { error: "Datos incompletos" };
  }

  try {
    await updateEvent(id, { name, code });
    revalidatePath("/admin");
    return { ok: true as const };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al guardar",
    };
  }
}

export async function archiveEventAction(formData: FormData) {
  await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  const days = Number(formData.get("days") ?? 30);
  const regenerateToken = formData.get("regenerate_token") === "true";

  if (!id) return { error: "ID inválido" };

  try {
    const { event, albumUrlPath } = await archiveEvent(id, days, {
      regenerateToken,
    });
    revalidatePath("/admin");
    return { ok: true as const, event, albumUrlPath };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al archivar",
    };
  }
}

export async function ensureAlbumTokenAction(formData: FormData) {
  await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID inválido" };

  try {
    const event = await ensureAlbumToken(id);
    revalidatePath("/admin");
    return {
      ok: true as const,
      event,
      albumUrlPath: event.album_token
        ? `/magazine/${event.album_token}`
        : null,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al generar token",
    };
  }
}

export async function deleteEventAction(formData: FormData) {
  await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  const mode = String(formData.get("mode") ?? "");
  const days = Number(formData.get("days") ?? 30);

  if (!id) return { error: "ID inválido" };
  if (mode !== "keep_images" && mode !== "purge") {
    return { error: "Modo de eliminación inválido" };
  }

  try {
    if (mode === "keep_images") {
      const event = await softDeleteEvent(id, days);
      revalidatePath("/admin");
      return {
        ok: true as const,
        mode: "keep_images" as const,
        event,
        albumUrlPath: event.album_token
          ? `/magazine/${event.album_token}`
          : null,
      };
    }

    await purgeEvent(id);
    revalidatePath("/admin");
    return { ok: true as const, mode: "purge" as const };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al eliminar",
    };
  }
}
