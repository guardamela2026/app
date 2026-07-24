"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { camposFaltantes } from "@/lib/ficha";
import { QrPanel } from "@/components/qr-panel";
import { Selector } from "@/components/selector";
import type { Categoria, Empresa, Subcategoria } from "@/lib/types";

const TIPOS_OK = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export function FichaEditor({
  empresa,
  categorias,
  subcategorias,
}: {
  empresa: Empresa;
  categorias: Categoria[];
  subcategorias: Subcategoria[];
}) {
  const router = useRouter();
  const [saved, setSaved] = useState<Empresa>(empresa);

  const [nombre, setNombre] = useState(empresa.nombre ?? "");
  const [telefono, setTelefono] = useState(empresa.telefono ?? "");
  const [email, setEmail] = useState(empresa.email ?? "");
  const [direccion, setDireccion] = useState(empresa.direccion ?? "");
  const [categoriaId, setCategoriaId] = useState(empresa.categoria_id ?? "");
  const [subcategoriaId, setSubcategoriaId] = useState(
    empresa.subcategoria_id ?? "",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(empresa.imagen_url);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");
  const publicUrl = `${base}/empresas/${empresa.id}`;
  const faltan = camposFaltantes(saved);

  // Sub-categorías de la categoría elegida. Sin categoría, el select va vacío
  // y deshabilitado: obliga a elegir de arriba hacia abajo.
  const subsDeCategoria = useMemo(
    () =>
      categoriaId
        ? subcategorias.filter((s) => s.categoria_id === categoriaId)
        : [],
    [categoriaId, subcategorias],
  );

  // Cambiar de categoría invalida la sub elegida (pertenecía a otra rama).
  function onCambiarCategoria(nuevaId: string) {
    setCategoriaId(nuevaId);
    setSubcategoriaId("");
  }

  function onPickImage(file: File | null) {
    setError(null);
    if (!file) return;
    if (!TIPOS_OK.includes(file.type)) {
      setError("Formato no permitido. Usá JPG, PNG o WEBP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("La imagen supera 5 MB.");
      return;
    }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    setSaving(true);
    const supabase = createClient();
    try {
      // 1. Categoría / sub-categoría: ids del catálogo fijo, nada que crear.
      const categoria_id = categoriaId || null;
      const subcategoria_id = categoria_id ? subcategoriaId || null : null;

      // 2. Imagen (opcional) -> Storage.
      let imagen_url = saved.imagen_url;
      if (imageFile) {
        const ext = (imageFile.name.split(".").pop() || "jpg").toLowerCase();
        const path = `empresas/${empresa.id}/tarjeta.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("tarjetas")
          .upload(path, imageFile, {
            upsert: true,
            contentType: imageFile.type,
          });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage
          .from("tarjetas")
          .getPublicUrl(path);
        imagen_url = `${pub.publicUrl}?v=${Date.now()}`;
      }

      // 3. Ficha.
      const { data: updated, error: uErr } = await supabase
        .from("empresas")
        .update({
          nombre: nombre.trim() || null,
          telefono: telefono.trim() || null,
          email: email.trim() || null,
          direccion: direccion.trim() || null,
          categoria_id,
          subcategoria_id,
          imagen_url,
        })
        .eq("id", empresa.id)
        .select("*")
        .single();
      if (uErr) throw uErr;

      setSaved(updated as Empresa);
      setImageFile(null);
      setOkMsg("Ficha guardada.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 300px",
        gap: 28,
        alignItems: "start",
      }}
    >
      <form onSubmit={guardar} className="card" style={{ padding: 22 }}>
        <div className="section-title" style={{ marginTop: 0 }}>
          Datos de la ficha
        </div>

        <div className="field">
          <label>Nombre de la empresa</label>
          <input
            className="input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Categoría</label>
            <Selector
              label="Categoría"
              value={categoriaId}
              onChange={onCambiarCategoria}
              opciones={categorias}
              placeholder="Elegí una categoría"
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Sub-categoría</label>
            <Selector
              label="Sub-categoría"
              value={subcategoriaId}
              onChange={setSubcategoriaId}
              opciones={subsDeCategoria}
              placeholder={
                categoriaId
                  ? "Elegí una sub-categoría"
                  : "Elegí primero una categoría"
              }
              disabled={!categoriaId}
            />
          </div>
        </div>
        <p className="hint" style={{ marginTop: -6, marginBottom: 16 }}>
          Si tu rubro no aparece, elegí la opción “Otro” de la categoría más
          cercana.
        </p>

        <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Teléfono</label>
            <input
              className="input"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Dirección</label>
          <input
            className="input"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Imagen de la tarjeta</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
          />
          <p className="hint">JPG, PNG o WEBP · hasta 5 MB · para tu ficha pública.</p>
          {preview && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={preview}
              alt="Vista previa"
              style={{
                marginTop: 10,
                maxWidth: "100%",
                borderRadius: 12,
                border: "1px solid var(--line)",
              }}
            />
          )}
        </div>

        {error && (
          <p style={{ color: "var(--terracota)", fontSize: 14, marginBottom: 12 }}>
            {error}
          </p>
        )}
        {okMsg && (
          <p style={{ color: "var(--verde)", fontSize: 14, marginBottom: 12 }}>
            {okMsg}
          </p>
        )}

        <button className="btn btn--primary" disabled={saving}>
          {saving ? "Guardando..." : "Guardar ficha"}
        </button>
      </form>

      <div className="stack" style={{ "--gap": "18px" } as React.CSSProperties}>
        <QrPanel url={publicUrl} faltan={faltan} />
        <div className="card" style={{ padding: 18 }}>
          <div className="section-title" style={{ marginTop: 0 }}>
            Estado
          </div>
          {faltan.length === 0 ? (
            <span className="chip chip--verde">Ficha completa · pública</span>
          ) : (
            <span className="chip chip--warn">Incompleta</span>
          )}
          <p className="hint" style={{ marginTop: 12 }}>
            <a href={publicUrl} target="_blank" style={{ color: "var(--terracota)" }}>
              Ver ficha pública ↗
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
