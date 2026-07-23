"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PerfilRol } from "@/lib/types";

export function SiteHeader() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [rol, setRol] = useState<PerfilRol | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function sync(session: unknown) {
      const hasSession = !!session;
      setAuthed(hasSession);
      if (!hasSession) {
        setRol(null);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setRol(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("tipo")
        .eq("id", user.id)
        .single();
      setRol((data?.tipo as PerfilRol) ?? "persona");
    }

    supabase.auth.getSession().then(({ data }) => sync(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      sync(session),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand">
          Guardamela
          <span className="brand__flag" aria-hidden="true" />
        </Link>
        <nav className="site-nav">
          <Link href="/">Explorar</Link>
          <Link href="/guardados">Guardados</Link>
          {authed ? (
            <>
              {rol && (
                <span
                  className={`role-badge role-badge--${rol}`}
                  title={
                    rol === "empresa"
                      ? "Cuenta de empresa: podés publicar fichas."
                      : "Cuenta de persona: guardás y explorás fichas."
                  }
                >
                  {rol === "empresa" ? "🏢 Empresa" : "🙋 Persona"}
                </span>
              )}
              {rol === "empresa" && <Link href="/panel">Panel</Link>}
              <button onClick={signOut}>Salir</button>
            </>
          ) : (
            <Link href="/login">Ingresar</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
