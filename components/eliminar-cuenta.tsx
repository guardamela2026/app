"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

/**
 * Botón de eliminar cuenta con confirmación por escrito: acción irreversible,
 * así que pedimos tipear ELIMINAR antes de habilitar. Llama a la route del
 * servidor (que usa service_role) y redirige al home ya sin sesión.
 */
export function EliminarCuenta() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmado = texto.trim().toUpperCase() === "ELIMINAR";

  async function eliminar() {
    if (!confirmado) return;
    setBorrando(true);
    setError(null);
    try {
      const res = await fetch("/api/eliminar-cuenta", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo eliminar la cuenta.");
      }
      // Cuenta borrada y sesión cerrada: al home.
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar la cuenta.");
      setBorrando(false);
    }
  }

  return (
    <div className="card" style={{ padding: 20, borderColor: "var(--terracota)" }}>
      <div className="row" style={{ gap: 8, alignItems: "center" }}>
        <AlertTriangle size={18} style={{ color: "var(--terracota)" }} />
        <h2 style={{ fontSize: 18, margin: 0 }}>Eliminar cuenta</h2>
      </div>
      <p className="hint" style={{ marginTop: 8 }}>
        Borra tu cuenta y todos tus datos (fichas, guardados, puntuaciones y
        notas). Esta acción no se puede deshacer.
      </p>

      {!abierto ? (
        <button
          type="button"
          className="btn btn--ghost"
          style={{ marginTop: 14, borderColor: "var(--terracota)", color: "var(--terracota)" }}
          onClick={() => setAbierto(true)}
        >
          Quiero eliminar mi cuenta
        </button>
      ) : (
        <div style={{ marginTop: 14 }}>
          <label className="hint" style={{ display: "block", marginBottom: 6 }}>
            Escribí <strong>ELIMINAR</strong> para confirmar:
          </label>
          <input
            className="input"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="ELIMINAR"
            autoFocus
          />
          {error && (
            <p style={{ color: "var(--terracota)", fontSize: 13, marginTop: 10 }}>
              {error}
            </p>
          )}
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button
              type="button"
              className="btn btn--primary"
              style={{ background: "var(--terracota)", borderColor: "var(--terracota)" }}
              disabled={!confirmado || borrando}
              onClick={eliminar}
            >
              {borrando ? "Eliminando…" : "Eliminar definitivamente"}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={borrando}
              onClick={() => {
                setAbierto(false);
                setTexto("");
                setError(null);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
