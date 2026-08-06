import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Elimina la cuenta del usuario autenticado. Borrar el usuario de auth.users
 * requiere la clave service_role (admin), que NUNCA va al cliente: por eso vive
 * en esta route del servidor.
 *
 * El borrado del usuario arrastra en cascada sus empresas, guardados,
 * puntuaciones y notas (FK on delete cascade sobre auth.users).
 */
export async function POST() {
  // 1. Validar sesión con el cliente normal (cookies). Nadie borra a otro.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 2. La service_role sólo existe en el server. Si falta, no seguimos.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Eliminación de cuenta no configurada en el servidor." },
      { status: 500 },
    );
  }

  // 3. Borrar el usuario con privilegios de admin.
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 4. Cerrar la sesión local (limpia las cookies).
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
