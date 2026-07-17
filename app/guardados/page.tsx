"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  listSaved,
  removeEmpresa,
  onGuardadosChange,
  type SavedItem,
} from "@/lib/guardados";
import type { EmpresaExpandida, GuardadoOrigen } from "@/lib/types";

interface ItemGuardado extends EmpresaExpandida {
  origen: GuardadoOrigen;
}

export default function GuardadosPage() {
  const [items, setItems] = useState<ItemGuardado[]>([]);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    const supabase = createClient();
    const { data: sess } = await supabase.auth.getSession();
    setAuthed(!!sess.session);

    const saved: SavedItem[] = await listSaved();
    if (saved.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    const ids = saved.map((s) => s.id);
    const { data } = await supabase
      .from("empresas")
      .select("*, categorias(nombre), subcategorias(nombre)")
      .in("id", ids);

    const origenPorId = new Map(saved.map((s) => [s.id, s.origen]));
    const rows = (data ?? []) as EmpresaExpandida[];
    // Preserva el orden de guardado (más reciente primero).
    const byId = new Map(rows.map((r) => [r.id, r]));
    const ordenados: ItemGuardado[] = ids
      .map((id) => byId.get(id))
      .filter((r): r is EmpresaExpandida => !!r)
      .map((r) => ({ ...r, origen: origenPorId.get(r.id) ?? "escaneo" }));
    setItems(ordenados);
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
    return onGuardadosChange(cargar);
  }, [cargar]);

  // Agrupar por categoría.
  const grupos = new Map<string, ItemGuardado[]>();
  for (const it of items) {
    const cat = it.categorias?.nombre ?? "Otros";
    const arr = grupos.get(cat) ?? [];
    arr.push(it);
    grupos.set(cat, arr);
  }

  return (
    <div style={{ padding: "28px 0" }}>
      <h1 style={{ fontSize: 30 }}>Servicios Guardados</h1>
      <p className="muted" style={{ marginBottom: 8 }}>
        {authed
          ? "Sincronizados con tu cuenta."
          : "Guardados en este dispositivo."}
      </p>

      {!authed && items.length > 0 && (
        <div className="card" style={{ padding: 16, margin: "16px 0" }}>
          <span className="chip chip--warn">Sólo en este dispositivo</span>
          <p className="hint" style={{ marginTop: 10 }}>
            <Link href="/login?next=/guardados" style={{ color: "var(--terracota)" }}>
              Registrate
            </Link>{" "}
            y estas fichas van a tu cuenta para siempre, en cualquier
            dispositivo.
          </p>
        </div>
      )}

      {loading ? (
        <div className="empty">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="empty">
          Todavía no guardaste ninguna empresa. Tocá la estrella en el Feed, o
          escaneá una ficha.
        </div>
      ) : (
        [...grupos.entries()].map(([cat, list]) => (
          <div key={cat}>
            <div className="section-title">{cat}</div>
            <div className="grid-cards">
              {list.map((e) => (
                <div key={e.id} className="card" style={{ padding: 16 }}>
                  <div
                    className="row"
                    style={{ justifyContent: "space-between", alignItems: "flex-start" }}
                  >
                    <Link href={`/empresas/${e.id}`}>
                      <h3 style={{ fontSize: 18 }}>{e.nombre}</h3>
                    </Link>
                    <button
                      className="star"
                      aria-label="Quitar de guardados"
                      title="Quitar"
                      onClick={() => removeEmpresa(e.id)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {e.subcategorias?.nombre && (
                      <span className="chip">{e.subcategorias.nombre}</span>
                    )}
                    <span className="chip">
                      {e.origen === "estrella" ? "★ guardada" : "escaneada"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
