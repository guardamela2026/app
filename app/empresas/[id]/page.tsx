import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Phone, Mail, MapPin, AtSign, Globe, Clock, Music2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AutoGuardar } from "@/components/auto-guardar";
import { Rating } from "@/components/rating";
import { instagramUrl } from "@/lib/instagram";
import { tiktokUrl } from "@/lib/tiktok";
import { mapsUrl, sitioWebUrl } from "@/lib/maps";
import type { EmpresaExpandida } from "@/lib/types";

export const dynamic = "force-dynamic";

type EmpresaConRating = EmpresaExpandida & {
  empresa_rating: { promedio: number; votos: number } | null;
};

async function getEmpresa(id: string): Promise<EmpresaConRating | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("empresas")
    .select(
      "*, categorias(nombre), subcategorias(nombre), empresa_rating(promedio, votos)",
    )
    .eq("id", id)
    .maybeSingle();
  return (data as EmpresaConRating | null) ?? null;
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

      <article
        className="card"
        style={{
          overflow: "hidden",
          boxShadow: "0 8px 24px oklch(18% 0.02 60 / 0.12)",
        }}
      >
        {e.imagen_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={e.imagen_url}
            alt={`Tarjeta de ${e.nombre ?? "la empresa"}`}
            style={{
              width: "100%",
              height: 260,
              objectFit: "cover",
              objectPosition: `${e.imagen_pos_x ?? 50}% ${e.imagen_pos_y ?? 50}%`,
              display: "block",
            }}
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
              <a href={`tel:${e.telefono}`} className="dato-fila">
                <Phone size={18} className="dato-fila__ico" />
                <span>{e.telefono}</span>
              </a>
            )}
            {e.email && (
              <a href={`mailto:${e.email}`} className="dato-fila">
                <Mail size={18} className="dato-fila__ico" />
                <span>{e.email}</span>
              </a>
            )}
            {e.direccion && (
              <a
                href={mapsUrl(e.direccion)}
                target="_blank"
                rel="noopener noreferrer"
                className="dato-fila dato-fila--accion"
              >
                <MapPin size={18} className="dato-fila__ico" />
                <span>{e.direccion}</span>
                <span className="dato-fila__cta">Cómo llegar →</span>
              </a>
            )}
            {e.horario && (
              <div className="dato-fila">
                <Clock size={18} className="dato-fila__ico" />
                <span style={{ whiteSpace: "pre-line" }}>{e.horario}</span>
              </div>
            )}
            {e.sitio_web && (
              <a
                href={sitioWebUrl(e.sitio_web)}
                target="_blank"
                rel="noopener noreferrer"
                className="dato-fila"
              >
                <Globe size={18} className="dato-fila__ico" />
                <span style={{ textDecoration: "underline" }}>{e.sitio_web}</span>
              </a>
            )}
            {e.instagram && (
              <a
                href={instagramUrl(e.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="dato-fila"
                style={{ color: "var(--terracota)" }}
              >
                <AtSign size={18} className="dato-fila__ico" />
                <span style={{ textDecoration: "underline" }}>@{e.instagram}</span>
              </a>
            )}
            {e.tiktok && (
              <a
                href={tiktokUrl(e.tiktok)}
                target="_blank"
                rel="noopener noreferrer"
                className="dato-fila"
                style={{ color: "var(--terracota)" }}
              >
                <Music2 size={18} className="dato-fila__ico" />
                <span style={{ textDecoration: "underline" }}>@{e.tiktok}</span>
              </a>
            )}
          </div>

          <div style={{ marginTop: 22, paddingTop: 20, borderTop: "var(--border)" }}>
            <Rating
              empresaId={e.id}
              promedioInicial={e.empresa_rating?.promedio ?? null}
              votosIniciales={e.empresa_rating?.votos ?? 0}
            />
          </div>

          <p className="hint" style={{ marginTop: 22 }}>
            Ficha en modo lectura · se guardó sola en tus Servicios Guardados.
          </p>
        </div>
      </article>
    </div>
  );
}
