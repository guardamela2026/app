"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Selector } from "@/components/selector";

const DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

/** Horas cada 30 min: "00:00" … "23:30". */
const HORAS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

const opsDia = DIAS.map((d) => ({ id: d, nombre: d }));
const opsHora = HORAS.map((h) => ({ id: h, nombre: h }));

/**
 * Constructor de horario: se arma una lista de tramos (día + apertura +
 * cierre) con selects, y se guarda como texto legible multilínea — una línea
 * por tramo, "Lunes 09:00–18:00" — que la ficha pública muestra tal cual.
 *
 * El value es ese texto (columna empresas.horario). Se parsea al montar para
 * poder editar tramos ya cargados con el formato nuevo; el texto libre viejo
 * que no matchee queda como estaba hasta que se reemplace.
 */
export function HorarioBuilder({
  value,
  onChange,
}: {
  value: string;
  onChange: (texto: string) => void;
}) {
  const tramos = useMemo(() => parseTramos(value), [value]);

  const [dia, setDia] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [error, setError] = useState<string | null>(null);

  function agregar() {
    setError(null);
    if (!dia || !desde || !hasta) {
      setError("Elegí día, apertura y cierre.");
      return;
    }
    if (desde >= hasta) {
      setError("La hora de cierre debe ser posterior a la de apertura.");
      return;
    }
    const nuevo: Tramo = { dia, desde, hasta };
    onChange(serializa([...tramos, nuevo]));
    setDia("");
    setDesde("");
    setHasta("");
  }

  function quitar(i: number) {
    onChange(serializa(tramos.filter((_, idx) => idx !== i)));
  }

  return (
    <div>
      {tramos.length > 0 && (
        <ul className="horario-lista">
          {tramos.map((t, i) => (
            <li key={i} className="horario-item">
              <span>
                <strong>{t.dia}</strong> {t.desde}–{t.hasta}
              </span>
              <button
                type="button"
                className="horario-quitar"
                aria-label={`Quitar ${t.dia}`}
                onClick={() => quitar(i)}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="horario-fila">
        <div style={{ flex: "1.4 1 130px" }}>
          <Selector
            label="Día"
            value={dia}
            onChange={setDia}
            opciones={opsDia}
            placeholder="Día"
          />
        </div>
        <div style={{ flex: "1 1 90px" }}>
          <Selector
            label="Apertura"
            value={desde}
            onChange={setDesde}
            opciones={opsHora}
            placeholder="Abre"
          />
        </div>
        <div style={{ flex: "1 1 90px" }}>
          <Selector
            label="Cierre"
            value={hasta}
            onChange={setHasta}
            opciones={opsHora}
            placeholder="Cierra"
          />
        </div>
        <button
          type="button"
          className="btn btn--ghost"
          style={{ flex: "none", padding: "0 14px" }}
          onClick={agregar}
        >
          <Plus size={16} /> Agregar
        </button>
      </div>
      {error && (
        <p className="hint" style={{ color: "var(--terracota)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface Tramo {
  dia: string;
  desde: string;
  hasta: string;
}

/** "Lunes 09:00–18:00" → {dia, desde, hasta}. Líneas que no matcheen se ignoran. */
function parseTramos(texto: string): Tramo[] {
  if (!texto) return [];
  const re = /^(.+?)\s+(\d{2}:\d{2})[–-](\d{2}:\d{2})$/;
  return texto
    .split("\n")
    .map((l) => l.trim().match(re))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => ({ dia: m[1], desde: m[2], hasta: m[3] }));
}

function serializa(tramos: Tramo[]): string {
  return tramos.map((t) => `${t.dia} ${t.desde}–${t.hasta}`).join("\n");
}
