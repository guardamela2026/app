"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SiteHeader() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [esEmpresa, setEsEmpresa] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function sync(session: boolean, userId?: string) {
      setAuthed(session);
      if (!session || !userId) {
        setEsEmpresa(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("tipo")
        .eq("id", userId)
        .maybeSingle();
      setEsEmpresa(data?.tipo === "empresa");
    }

    supabase.auth
      .getSession()
      .then(({ data }) => sync(!!data.session, data.session?.user.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      sync(!!session, session?.user.id),
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
          Guárdamela
          <span className="brand__flag" aria-hidden="true" />
        </Link>
        <nav className="site-nav">
          <Link href="/">Explorar</Link>
          <Link href="/guardados">Guardados</Link>
          {authed ? (
            <>
              {esEmpresa && <Link href="/panel">Panel</Link>}
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
