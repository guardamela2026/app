import { createClient } from "@/lib/supabase/server";
import type { PerfilRol } from "@/lib/types";

/**
 * Devuelve el usuario autenticado y su rol (persona | empresa).
 * `rol` es null cuando no hay sesión. Si hay sesión pero (por algún motivo)
 * no existe fila en `profiles`, se asume 'persona' — el rol menos privilegiado.
 * La tabla real es `profiles` y la columna es `tipo`.
 */
export async function getUsuarioConRol(): Promise<{
  userId: string | null;
  rol: PerfilRol | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: null, rol: null };

  const { data } = await supabase
    .from("profiles")
    .select("tipo")
    .eq("id", user.id)
    .single();

  return { userId: user.id, rol: (data?.tipo as PerfilRol) ?? "persona" };
}
