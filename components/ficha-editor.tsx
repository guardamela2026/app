"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { camposFaltantes } from "@/lib/ficha";
import { instagramHandle, instagramUrl } from "@/lib/instagram";
import { tiktokHandle, tiktokUrl } from "@/lib/tiktok";
import { emailValido, telefonoValido } from "@/lib/validacion";
import { QrPanel } from "@/components/qr-panel";
import { Selector } from "@/components/selector";
import { DireccionInput } from "@/components/direccion-input";
import { TelefonoInput } from "@/components/telefono-input";
import { HorarioBuilder } from "@/components/horario-builder";
import { ImageFocus } from "@/components/image-focus";
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
  const [horario, setHorario] = useState(empresa.horario ?? "");
  const [sitioWeb, setSitioWeb] = useState(empresa.sitio_web ?? "");
  const [instagram, setInstagram] = useState(empresa.instagram ?? "");
  const [tiktok, setTiktok] = useState(empresa.tiktok ?? "");
  const [categoriaId, setCategoriaId] = useState(empresa.categoria_id ?? "");
  const [subcategoriaId, setSubcategoriaId] = useState(
    empresa.subcategoria_id ?? "",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(empresa.imagen_url);
  const [posX, setPosX] = useState(empresa.imagen_pos_x ?? 50);
  const [posY, setPosY] = useState(empresa.imagen_pos_y ?? 50);
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

  // Requisitos mínimos, en vivo, para habilitar el botón de guardar.
  // (La validación dura vuelve a chequearse en guardar(), por las dudas.)
  const listaParaGuardar =
    nombre.trim() !== "" &&
    categoriaId !== "" &&
    subcategoriaId !== "" &&
    (imageFile !== null || (saved.imagen_url?.trim() ?? "") !== "");

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
    // El encuadre anterior no aplica a otra foto: se vuelve al centro.
    setPosX(50);
    setPosY(50);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    setSaving(true);
    const supabase = createClient();
    try {
      // 0. Requisitos mínimos para guardar (sobre el estado del formulario,
      //    contando el archivo recién elegido aunque todavía no se haya subido).
      const faltan: string[] = [];
      if (!nombre.trim()) faltan.push("el nombre");
      if (!categoriaId) faltan.push("la categoría");
      else if (!subcategoriaId) faltan.push("la sub-categoría");
      if (!imageFile && !saved.imagen_url?.trim()) faltan.push("la imagen");
      if (faltan.length > 0) {
        throw new Error(`Falta completar: ${faltan.join(", ")}.`);
      }

      // Email y teléfono son opcionales, pero si se cargan deben ser válidos.
      if (email.trim() && !emailValido(email)) {
        throw new Error("El email no tiene un formato válido.");
      }
      if (telefono.trim() && !telefonoValido(telefono)) {
        throw new Error("El teléfono no es válido (7 a 15 dígitos).");
      }

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

      // 3. Redes: se guarda el handle normalizado, no lo que se tipeó.
      let handle: string | null = null;
      if (instagram.trim()) {
        handle = instagramHandle(instagram);
        if (!handle) {
          throw new Error(
            "El Instagram no es válido. Usá tu usuario (ej. mi.negocio) o el link de tu perfil.",
          );
        }
      }
      let handleTiktok: string | null = null;
      if (tiktok.trim()) {
        handleTiktok = tiktokHandle(tiktok);
        if (!handleTiktok) {
          throw new Error(
            "El TikTok no es válido. Usá tu usuario (ej. mi.negocio) o el link de tu perfil.",
          );
        }
      }

      // 4. Ficha.
      const { data: updated, error: uErr } = await supabase
        .from("empresas")
        .update({
          nombre: nombre.trim() || null,
          telefono: telefono.trim() || null,
          email: email.trim() || null,
          direccion: direccion.trim() || null,
          horario: horario.trim() || null,
          sitio_web: sitioWeb.trim() || null,
          instagram: handle,
          tiktok: handleTiktok,
          categoria_id,
          subcategoria_id,
          imagen_url,
          imagen_pos_x: Math.round(posX),
          imagen_pos_y: Math.round(posY),
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
        <p className="hint" style={{ marginTop: -6, marginBottom: 16 }}>
          Los campos con <span style={{ color: "var(--terracota)" }}>*</span> son
          obligatorios para guardar.
        </p>

        <div className="field">
          <label>
            Nombre de la empresa <span style={{ color: "var(--terracota)" }}>*</span>
          </label>
          <input
            className="input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>
              Categoría <span style={{ color: "var(--terracota)" }}>*</span>
            </label>
            <Selector
              label="Categoría"
              value={categoriaId}
              onChange={onCambiarCategoria}
              opciones={categorias}
              placeholder="Elegí una categoría"
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>
              Sub-categoría <span style={{ color: "var(--terracota)" }}>*</span>
            </label>
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
            <TelefonoInput value={telefono} onChange={setTelefono} />
            <p className="hint">País · área · número.</p>
            {telefono.trim() && !telefonoValido(telefono) && (
              <p className="hint" style={{ color: "var(--terracota)" }}>
                Teléfono inválido (7 a 15 dígitos).
              </p>
            )}
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {email.trim() && !emailValido(email) && (
              <p className="hint" style={{ color: "var(--terracota)" }}>
                Email inválido (ej. nombre@dominio.com).
              </p>
            )}
          </div>
        </div>

        <div className="field">
          <label>Dirección</label>
          <DireccionInput value={direccion} onChange={setDireccion} />
          <p className="hint">
            Empezá a escribir y elegí del desplegable · se muestra con un botón
            “Cómo llegar” en la ficha.
          </p>
        </div>

        <div className="field">
          <label>Horario</label>
          <HorarioBuilder value={horario} onChange={setHorario} />
        </div>

        <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Sitio web</label>
            <input
              className="input"
              value={sitioWeb}
              onChange={(e) => setSitioWeb(e.target.value)}
              placeholder="misitio.com"
              inputMode="url"
            />
          </div>
        </div>

        <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Instagram</label>
            <input
              className="input"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="mi.negocio"
              inputMode="url"
            />
            {instagram.trim() ? (
              instagramHandle(instagram) ? (
                <p className="hint">
                  Se va a ver como{" "}
                  <a
                    href={instagramUrl(instagramHandle(instagram)!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--terracota)" }}
                  >
                    @{instagramHandle(instagram)}
                  </a>
                </p>
              ) : (
                <p className="hint" style={{ color: "var(--terracota)" }}>
                  No parece un usuario válido. Usá tu usuario o el link.
                </p>
              )
            ) : (
              <p className="hint">Tu usuario o link. Opcional.</p>
            )}
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>TikTok</label>
            <input
              className="input"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              placeholder="mi.negocio"
              inputMode="url"
            />
            {tiktok.trim() ? (
              tiktokHandle(tiktok) ? (
                <p className="hint">
                  Se va a ver como{" "}
                  <a
                    href={tiktokUrl(tiktokHandle(tiktok)!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--terracota)" }}
                  >
                    @{tiktokHandle(tiktok)}
                  </a>
                </p>
              ) : (
                <p className="hint" style={{ color: "var(--terracota)" }}>
                  No parece un usuario válido. Usá tu usuario o el link.
                </p>
              )
            ) : (
              <p className="hint">Tu usuario o link. Opcional.</p>
            )}
          </div>
        </div>

        <div className="field">
          <label>
            Imagen de la tarjeta <span style={{ color: "var(--terracota)" }}>*</span>
          </label>
          {/* Input nativo oculto: el botón con estilos de la app lo dispara. */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
            style={{ display: "none" }}
          />
          <div className="row" style={{ gap: 12, alignItems: "center" }}>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? "Cambiar imagen" : "Seleccionar imagen"}
            </button>
            <span className="hint" style={{ marginTop: 0 }}>
              {imageFile?.name ?? "Ningún archivo seleccionado"}
            </span>
          </div>
          <p className="hint">JPG, PNG o WEBP · hasta 5 MB · para tu ficha pública.</p>
          {preview && (
            <ImageFocus
              src={preview}
              posX={posX}
              posY={posY}
              onChange={(x, y) => {
                setPosX(x);
                setPosY(y);
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

        <button
          className="btn btn--primary"
          disabled={saving || !listaParaGuardar}
        >
          {saving ? "Guardando..." : "Guardar ficha"}
        </button>
        {!listaParaGuardar && (
          <p className="hint" style={{ marginTop: 8 }}>
            Completá los campos con{" "}
            <span style={{ color: "var(--terracota)" }}>*</span> para guardar.
          </p>
        )}
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
