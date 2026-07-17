import { createClient } from "@/lib/supabase/client";
import type { GuardadoOrigen } from "@/lib/types";

// Fuente de verdad: si hay sesión -> DB (tabla guardados); si no -> localStorage.
// Al iniciar sesión, migrateLocalToDb() sube el localStorage y lo limpia.

const LS_KEY = "guardamela.guardados";
const EVENT = "guardados-changed";

export interface SavedItem {
  id: string; // empresa_id
  origen: GuardadoOrigen;
}

function emitChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

/** Suscribirse a cambios en la lista de guardados (para refrescar UI). */
export function onGuardadosChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb); // sync entre pestañas
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function readLocal(): SavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as SavedItem[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: SavedItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
  emitChange();
}

async function currentUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/** Lista de guardados de la fuente activa (DB si hay sesión, si no localStorage). */
export async function listSaved(): Promise<SavedItem[]> {
  const uid = await currentUserId();
  if (!uid) return readLocal();
  const supabase = createClient();
  const { data } = await supabase
    .from("guardados")
    .select("empresa_id, origen")
    .order("created_at", { ascending: false });
  return (data ?? []).map((g) => ({ id: g.empresa_id, origen: g.origen as GuardadoOrigen }));
}

/** Guarda una empresa. No duplica: si ya estaba, no cambia el origen previo. */
export async function saveEmpresa(empresaId: string, origen: GuardadoOrigen): Promise<void> {
  const uid = await currentUserId();
  if (!uid) {
    const list = readLocal();
    if (list.some((x) => x.id === empresaId)) return;
    writeLocal([{ id: empresaId, origen }, ...list]);
    return;
  }
  const supabase = createClient();
  await supabase
    .from("guardados")
    .upsert(
      { usuario_id: uid, empresa_id: empresaId, origen },
      { onConflict: "usuario_id,empresa_id", ignoreDuplicates: true },
    );
  emitChange();
}

/** Elimina una empresa de guardados. */
export async function removeEmpresa(empresaId: string): Promise<void> {
  const uid = await currentUserId();
  if (!uid) {
    writeLocal(readLocal().filter((x) => x.id !== empresaId));
    return;
  }
  const supabase = createClient();
  await supabase.from("guardados").delete().eq("empresa_id", empresaId);
  emitChange();
}

/**
 * Sube el localStorage a la cuenta y lo limpia (HU-7).
 * Merge sin duplicados: los guardados previos de la cuenta se preservan.
 */
export async function migrateLocalToDb(userId: string): Promise<void> {
  const local = readLocal();
  if (local.length === 0) return;
  const supabase = createClient();
  const rows = local.map((x) => ({ usuario_id: userId, empresa_id: x.id, origen: x.origen }));
  await supabase
    .from("guardados")
    .upsert(rows, { onConflict: "usuario_id,empresa_id", ignoreDuplicates: true });
  localStorage.removeItem(LS_KEY);
  emitChange();
}
