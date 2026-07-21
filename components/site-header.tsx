"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SiteHeader() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setAuthed(!!session),
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
        </Link>
        <nav className="site-nav">
          <Link href="/">Explorar</Link>
          <Link href="/guardados">Guardados</Link>
          {authed ? (
            <>
              <Link href="/panel">Panel</Link>
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
