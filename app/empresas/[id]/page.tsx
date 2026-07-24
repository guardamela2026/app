import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AutoGuardar } from "@/components/auto-guardar";
import type { EmpresaExpandida } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getEmpresa(id: string): Promise<EmpresaExpandida | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("empresas")
    .select("*, categorias(nombre), subcategorias(nombre)")
    .eq("id", id)
    .maybeSingle();
  return (data as EmpresaExpandida | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const e = await getEmpresa(id);
  return { title: e?.nombre ? `${e.nombre} · Guardamela` : "Guardamela" };
}

export default async function FichaPublicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const e = await getEmpresa(id);
  // RLS: anónimo sólo recibe fichas completas; incompleta -> null -> 404.
  if (!e) notFound();

  return (
    <div style={{ maxWidth: 560, margin: "40px auto" }}>
      {e.ficha_completa && <AutoGuardar empresaId={e.id} />}

      <article className="card" style={{ overflow: "hidden" }}>
        {e.imagen_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={e.imagen_url}
            alt={`Tarjeta de ${e.nombre ?? "la empresa"}`}
            style={{ width: "100%", display: "block" }}
          />
        )}
        <div style={{ padding: 24 }}>
          <h1 style={{ fontSize: 28, marginBottom: 10 }}>{e.nombre}</h1>
          <div className="row" style={{ gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {e.categorias?.nombre && (
              <span className="chip chip--terracota">{e.categorias.nombre}</span>
            )}
            {e.subcategorias?.nombre && (
              <span className="chip">{e.subcategorias.nombre}</span>
            )}
          </div>

          <div className="stack" style={{ "--gap": "12px" } as React.CSSProperties}>
            {e.telefono && (
              <a href={`tel:${e.telefono}`} className="row" style={{ gap: 10 }}>
                <span>📞</span>
                <span>{e.telefono}</span>
              </a>
            )}
            {e.email && (
              <a href={`mailto:${e.email}`} className="row" style={{ gap: 10 }}>
                <span>✉️</span>
                <span>{e.email}</span>
              </a>
            )}
            {e.direccion && (
              <div className="row" style={{ gap: 10 }}>
                <span>📍</span>
                <span>{e.direccion}</span>
              </div>
            )}
          </div>

          <p className="hint" style={{ marginTop: 22 }}>
            Ficha en modo lectura · se guardó sola en tus Servicios Guardados.
          </p>
        </div>
      </article>
    </div>
  );
}
