"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Nota privada sobre una empresa guardada. Vive en guardados.nota y la RLS
 * (auth.uid() = usuario_id) la aísla: sólo la ve y edita quien la escribió.
 * Requiere sesión — se muestra únicamente en Guardados con cuenta.
 */
export function NotaGuardado({
  empresaId,
  notaInicial,
}: {
  empresaId: string;
  notaInicial: string | null;
}) {
  const [nota, setNota] = useState(notaInicial ?? "");
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(nota);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const limpio = borrador.trim();
      await supabase
        .from("guardados")
        .update({ nota: limpio || null })
        .eq("usuario_id", user.id)
        .eq("empresa_id", empresaId);
      setNota(limpio);
    }
    setGuardando(false);
    setEditando(false);
  }

  if (editando) {
    return (
      <div style={{ marginTop: 10 }}>
        <textarea
          className="textarea"
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          placeholder="Tu nota (privada): p. ej. pedir la napolitana"
          maxLength={500}
          rows={2}
          autoFocus
        />
        <div className="row" style={{ gap: 6, marginTop: 6 }}>
          <button
            type="button"
            className="btn btn--primary"
            style={{ padding: "6px 12px", fontSize: 12 }}
            onClick={guardar}
            disabled={guardando}
          >
            <Check size={14} /> Guardar
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            style={{ padding: "6px 12px", fontSize: 12 }}
            onClick={() => {
              setBorrador(nota);
              setEditando(false);
            }}
            disabled={guardando}
          >
            <X size={14} /> Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="nota-chip"
      onClick={() => {
        setBorrador(nota);
        setEditando(true);
      }}
      title={nota ? "Editar nota" : "Agregar nota"}
    >
      <Pencil size={13} className="nota-chip__ico" />
      <span className={nota ? undefined : "nota-chip__vacia"}>
        {nota || "Agregar nota"}
      </span>
    </button>
  );
}
