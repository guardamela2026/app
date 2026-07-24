import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioConRol } from "@/lib/perfil";
import { Feed } from "@/components/feed";
import type { EmpresaExpandida } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { rol } = await getUsuarioConRol();
  // Una persona logueada no puede publicar: no le mostramos ese CTA.
  const puedePublicar = rol !== "persona"; // sin login (null) o empresa
  const { data } = await supabase
    .from("empresas")
    .select("*, categorias(nombre), subcategorias(nombre)")
    .eq("ficha_completa", true)
    .order("created_at", { ascending: false });

  return (
    <>
      <section style={{ padding: "64px 0 36px", textAlign: "center" }}>
        <span
          className="mono"
          style={{
            display: "inline-block",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: 3,
            padding: "8px 18px",
            background: "var(--ink)",
            color: "var(--paper)",
            transform: "rotate(-3deg)",
          }}
        >
          Escaneá. Guardá. Listo.
        </span>
        <h1
          style={{
            fontSize: "clamp(44px, 9vw, 104px)",
            letterSpacing: "-1.5px",
            lineHeight: 0.95,
            margin: "24px auto 0",
            maxWidth: 900,
            textShadow: "6px 6px 0 oklch(75% 0.14 85 / 0.55)",
          }}
        >
          La tarjeta de tu{" "}
          <span style={{ color: "var(--terracota)" }}>negocio</span>, en el
          bolsillo de{" "}
          <span
            style={{
              textDecoration: "underline",
              textDecorationThickness: 4,
              textUnderlineOffset: 8,
            }}
          >
            cualquiera.
          </span>
        </h1>
        <p
          style={{
            maxWidth: 560,
            margin: "28px auto 0",
            fontSize: 19,
            lineHeight: 1.5,
          }}
        >
          Publicás tu ficha, generás un QR, y quien lo escanea la guarda sola —
          sin registrarse, sin fricción.
        </p>
        <div
          className="row"
          style={{ justifyContent: "center", gap: 14, marginTop: 34 }}
        >
          {puedePublicar && (
            <Link
              className="btn btn--primary"
              href={rol === "empresa" ? "/panel" : "/login?role=empresa"}
            >
              Publicar mi ficha
            </Link>
          )}
          <Link
            className={puedePublicar ? "btn btn--ghost" : "btn btn--primary"}
            href="/guardados"
          >
            Ver mis guardados
          </Link>
        </div>
      </section>

      <div className="marquee">
        <div className="marquee__track">
          {[0, 1].map((dup) => (
            <span key={dup} aria-hidden={dup === 1}>
              {[
                "Gastronomía",
                "Comercios",
                "Servicios",
                "Oficios",
                "Salud",
                "Cultura",
                "Hogar",
              ].map((w) => (
                <span key={w}>
                  {w}
                  <span className="marquee__sep">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <Feed empresas={(data ?? []) as EmpresaExpandida[]} />
    </>
  );
}