"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  listSaved,
  saveEmpresa,
  removeEmpresa,
  onGuardadosChange,
} from "@/lib/guardados";
import { Selector } from "@/components/selector";
import type { EmpresaExpandida } from "@/lib/types";

export function Feed({ empresas }: { empresas: EmpresaExpandida[] }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("");
  const [sub, setSub] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const refresh = () =>
      listSaved().then((l) => setSavedIds(new Set(l.map((x) => x.id))));
    refresh();
    return onGuardadosChange(refresh);
  }, []);

  const categorias = useMemo(
    () =>
      Array.from(
        new Set(empresas.map((e) => e.categorias?.nombre).filter(Boolean)),
      ) as string[],
    [empresas],
  );
  const subcategorias = useMemo(
    () =>
      Array.from(
        new Set(
          empresas
            .filter((e) => !cat || e.categorias?.nombre === cat)
            .map((e) => e.subcategorias?.nombre)
            .filter(Boolean),
        ),
      ) as string[],
    [empresas, cat],
  );

  // El filtro usa nombres como valor (no ids): cada opción se identifica por
  // su propio nombre. La primera limpia el filtro (equivale al value="").
  const opcionesCat = useMemo(
    () => [
      { id: "", nombre: "Todas las categorías" },
      ...categorias.map((c) => ({ id: c, nombre: c })),
    ],
    [categorias],
  );
  const opcionesSub = useMemo(
    () => [
      { id: "", nombre: "Todas las sub-categorías" },
      ...subcategorias.map((s) => ({ id: s, nombre: s })),
    ],
    [subcategorias],
  );

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return empresas.filter((e) => {
      if (q && !(e.nombre ?? "").toLowerCase().includes(q)) return false;
      if (cat && e.categorias?.nombre !== cat) return false;
      if (sub && e.subcategorias?.nombre !== sub) return false;
      return true;
    });
  }, [empresas, query, cat, sub]);

  async function toggle(id: string) {
    if (savedIds.has(id)) await removeEmpresa(id);
    else await saveEmpresa(id, "estrella");
  }

  return (
    <section style={{ padding: "8px 0 40px" }}>
      <div className="section-title">Feed público con búsqueda</div>

      <div
        className="row"
        style={{ gap: 10, flexWrap: "wrap", marginBottom: 22 }}
      >
        <input
          className="input"
          style={{ flex: "2 1 220px" }}
          placeholder="Buscar por nombre…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div style={{ flex: "1 1 160px" }}>
          <Selector
            label="Filtrar por categoría"
            value={cat}
            onChange={(v) => {
              setCat(v);
              setSub("");
            }}
            opciones={opcionesCat}
            placeholder="Todas las categorías"
          />
        </div>
        <div style={{ flex: "1 1 160px" }}>
          <Selector
            label="Filtrar por sub-categoría"
            value={sub}
            onChange={setSub}
            opciones={opcionesSub}
            placeholder="Todas las sub-categorías"
          />
        </div>
      </div>

      {resultados.length === 0 ? (
        <div className="empty">No hay empresas que coincidan con la búsqueda.</div>
      ) : (
        <div className="grid-cards">
          {resultados.map((e) => {
            const guardada = savedIds.has(e.id);
            return (
              <div key={e.id} className="card" style={{ overflow: "hidden" }}>
                <Link href={`/empresas/${e.id}`}>
                  {e.imagen_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={e.imagen_url}
                      alt={e.nombre ?? ""}
                      style={{
                        width: "100%",
                        height: 150,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div style={{ height: 150, background: "var(--paper-3)" }} />
                  )}
                </Link>
                <div style={{ padding: 16 }}>
                  <div
                    className="row"
                    style={{ justifyContent: "space-between", alignItems: "flex-start" }}
                  >
                    <Link href={`/empresas/${e.id}`}>
                      <h3 style={{ fontSize: 18 }}>{e.nombre}</h3>
                    </Link>
                    <button
                      className={`star ${guardada ? "star--on" : ""}`}
                      aria-label={guardada ? "Quitar de guardados" : "Guardar"}
                      title={guardada ? "Guardada" : "Guardar"}
                      onClick={() => toggle(e.id)}
                    >
                      {guardada ? "★" : "☆"}
                    </button>
                  </div>
                  <div
                    className="row"
                    style={{ gap: 6, marginTop: 8, flexWrap: "wrap" }}
                  >
                    {e.categorias?.nombre && (
                      <span className="chip chip--terracota">
                        {e.categorias.nombre}
                      </span>
                    )}
                    {e.subcategorias?.nombre && (
                      <span className="chip">{e.subcategorias.nombre}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
