"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const DIAS_GRACIA = 30;

/**
 * Soft delete de cuenta. "Eliminar" programa la baja a DIAS_GRACIA días (RPC
 * programar_eliminacion_cuenta) y cierra sesión; dentro del plazo el usuario
 * puede cancelar. La purga real la hace un cron en la base. Pide tipear
 * ELIMINAR porque, aunque reversible, oculta la cuenta de inmediato.
 */
export function EliminarCuenta({
  programadaInicial,
}: {
  programadaInicial: string | null;
}) {
  const router = useRouter();
  const [programada, setProgramada] = useState<string | null>(programadaInicial);
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmado = texto.trim().toUpperCase() === "ELIMINAR";

  async function programar() {
    if (!confirmado) return;
    setOcupado(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("programar_eliminacion_cuenta", {
      dias: DIAS_GRACIA,
    });
    if (error) {
      setError(error.message);
      setOcupado(false);
      return;
    }
    // Baja programada: cerramos sesión y volvemos al home.
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function cancelar() {
    setOcupado(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("cancelar_eliminacion_cuenta");
    if (error) {
      setError(error.message);
      setOcupado(false);
      return;
    }
    setProgramada(null);
    setOcupado(false);
    router.refresh();
  }

  // Cuenta ya en proceso de baja: ofrecer recuperarla.
  if (programada) {
    const fecha = new Date(programada).toLocaleDateString("es", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return (
      <div className="card" style={{ padding: 20, borderColor: "var(--terracota)" }}>
        <div className="row" style={{ gap: 8, alignItems: "center" }}>
          <AlertTriangle size={18} style={{ color: "var(--terracota)" }} />
          <h2 style={{ fontSize: 18, margin: 0 }}>Cuenta en proceso de eliminación</h2>
        </div>
        <p className="hint" style={{ marginTop: 8 }}>
          Tu cuenta y tus datos se borrarán definitivamente el <strong>{fecha}</strong>.
          Hasta entonces podés recuperarla.
        </p>
        {error && (
          <p style={{ color: "var(--terracota)", fontSize: 13, marginTop: 10 }}>
            {error}
          </p>
        )}
        <button
          type="button"
          className="btn btn--primary"
          style={{ marginTop: 14 }}
          disabled={ocupado}
          onClick={cancelar}
        >
          {ocupado ? "Recuperando…" : "Recuperar mi cuenta"}
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 20, borderColor: "var(--terracota)" }}>
      <div className="row" style={{ gap: 8, alignItems: "center" }}>
        <AlertTriangle size={18} style={{ color: "var(--terracota)" }} />
        <h2 style={{ fontSize: 18, margin: 0 }}>Eliminar cuenta</h2>
      </div>
      <p className="hint" style={{ marginTop: 8 }}>
        Tu cuenta se ocultará de inmediato y se borrará definitivamente a los{" "}
        {DIAS_GRACIA} días (fichas, guardados, puntuaciones y notas). Durante ese
        plazo podés recuperarla iniciando sesión de nuevo.
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
              disabled={!confirmado || ocupado}
              onClick={programar}
            >
              {ocupado ? "Procesando…" : "Eliminar mi cuenta"}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={ocupado}
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
