"use client";

import { useEffect, useRef, useState } from "react";

/** Código de país fijo (Argentina). No editable en la UI. */
const PAIS_FIJO = "+54";

/**
 * Teléfono en partes: país (fijo +54), código de área y número. Hacia afuera
 * entrega un único string "+54 11 12345678" (columna empresas.telefono). Al
 * montar, intenta descomponer el valor existente para poder editarlo; si no
 * matchea el formato, cae entero en "número".
 */
export function TelefonoInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (telefono: string) => void;
}) {
  const inicial = useRef(descomponer(value)).current;
  const [area, setArea] = useState(inicial.area);
  const [numero, setNumero] = useState(inicial.numero);

  // Recompone y avisa al padre cuando cambia cualquier parte.
  useEffect(() => {
    onChange(componer(PAIS_FIJO, area, numero));
    // onChange se recrea en cada render del padre; sólo dependemos de las partes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, numero]);

  return (
    <div className="tel-input">
      <div className="tel-input__campo" style={{ flex: "0 0 64px" }}>
        <input
          className="input"
          value={PAIS_FIJO}
          disabled
          aria-label="Código de país (fijo)"
        />
        <span className="tel-input__label">País</span>
      </div>
      <div className="tel-input__campo" style={{ flex: "0 0 74px" }}>
        <input
          className="input"
          value={area}
          onChange={(e) => setArea(soloDigitos(e.target.value))}
          placeholder="11"
          inputMode="tel"
          aria-label="Código de área"
        />
        <span className="tel-input__label">Área</span>
      </div>
      <div className="tel-input__campo" style={{ flex: 1 }}>
        <input
          className="input"
          value={numero}
          onChange={(e) => setNumero(soloDigitos(e.target.value))}
          placeholder="12345678"
          inputMode="tel"
          aria-label="Número"
        />
        <span className="tel-input__label">Número</span>
      </div>
    </div>
  );
}

function soloDigitos(s: string): string {
  return s.replace(/\D/g, "");
}

function componer(pais: string, area: string, numero: string): string {
  const partes = [pais.trim(), area.trim(), numero.trim()].filter(Boolean);
  // Sólo devolvemos algo si hay área o número; el +54 solo no es un teléfono.
  return area.trim() || numero.trim() ? partes.join(" ") : "";
}

/** Separa "+54 11 12345678" en sus partes. Best-effort para datos existentes. */
function descomponer(v: string): { area: string; numero: string } {
  const s = (v ?? "").trim();
  if (!s) return { area: "", numero: "" };
  // Quitamos el país fijo si está al principio.
  const sinPais = s.replace(/^\+54\s*/, "");
  const partes = sinPais.split(/\s+/);
  if (partes.length >= 2) {
    return { area: partes[0], numero: partes.slice(1).join("") };
  }
  // Un solo bloque: lo dejamos en número para no perder nada.
  return { area: "", numero: sinPais };
}
