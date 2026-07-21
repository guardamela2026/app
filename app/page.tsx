import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Feed } from "@/components/feed";
import type { EmpresaExpandida } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("empresas")
    .select("*, categorias(nombre), subcategorias(nombre)")
    .eq("ficha_completa", true)
    .order("created_at", { ascending: false });

  return (
    <>
      <section style={{ padding: "56px 0 32px", textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(34px, 6vw, 56px)", marginBottom: 18 }}>
          Escaneá, Guardá y Listo.
        </h1>
        <p
          className="muted"
          style={{ maxWidth: 560, margin: "0 auto 26px", fontSize: 18 }}
        >
          La tarjeta de tu negocio, en el bolsillo de cualquiera. Publicás tu
          ficha, generás un QR, y quien lo escanea la guarda sola — sin
          registrarse.
        </p>
        <div className="row" style={{ justifyContent: "center", gap: 12 }}>
          <Link className="btn btn--primary" href="/login?role=empresa">
            Publicar mi ficha
          </Link>
          <Link className="btn btn--ghost" href="/guardados">
            Ver mis guardados
          </Link>
        </div>
      </section>

      <Feed empresas={(data ?? []) as EmpresaExpandida[]} />
    </>
  );
}