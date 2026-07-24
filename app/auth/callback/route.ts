import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Intercambia el código de OAuth / confirmación de email por una sesión.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const rol = searchParams.get("rol") === "empresa" ? "empresa" : "persona";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // En OAuth (Google) el trigger no recibe nuestro rol, así que fijamos el
      // perfil acá. En el primer alta inserta; si ya existía (email/contraseña
      // o login repetido), el conflicto se ignora y el rol original se mantiene.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .upsert({ id: user.id, tipo: rol }, { onConflict: "id", ignoreDuplicates: true });
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
