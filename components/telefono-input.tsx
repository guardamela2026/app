"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Teléfono en tres partes: código de país (+54), código de área (11) y número.
 * Hacia afuera entrega un único string "+54 11 12345678" (columna
 * empresas.telefono). Al montar, intenta descomponer el valor existente para
 * poder editarlo; si no matchea el formato, cae entero en "número".
 */
export function TelefonoInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (telefono: string) => void;
}) {
  const inicial = useRef(descomponer(value)).current;
  const [pais, setPais] = useState(inicial.pais);
  const [area, setArea] = useState(inicial.area);
  const [numero, setNumero] = useState(inicial.numero);

  // Recompone y avisa al padre cuando cambia cualquier parte.
  useEffect(() => {
    onChange(componer(pais, area, numero));
    // onChange se recrea en cada render del padre; sólo dependemos de las partes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pais, area, numero]);

  return (
    <div className="row" style={{ gap: 8 }}>
      <input
        className="input"
        style={{ flex: "0 0 74px" }}
        value={pais}
        onChange={(e) => setPais(limpiaPais(e.target.value))}
        placeholder="+54"
        inputMode="tel"
        aria-label="Código de país"
      />
      <input
        className="input"
        style={{ flex: "0 0 74px" }}
        value={area}
        onChange={(e) => setArea(soloDigitos(e.target.value))}
        placeholder="11"
        inputMode="tel"
        aria-label="Código de área"
      />
      <input
        className="input"
        style={{ flex: 1 }}
        value={numero}
        onChange={(e) => setNumero(soloDigitos(e.target.value))}
        placeholder="12345678"
        inputMode="tel"
        aria-label="Número"
      />
    </div>
  );
}

function soloDigitos(s: string): string {
  return s.replace(/\D/g, "");
}

/** El país permite un + inicial y dígitos. */
function limpiaPais(s: string): string {
  const d = s.replace(/[^\d+]/g, "");
  return d.startsWith("+") ? "+" + d.slice(1).replace(/\+/g, "") : d;
}

function componer(pais: string, area: string, numero: string): string {
  const partes = [pais.trim(), area.trim(), numero.trim()].filter(Boolean);
  return partes.join(" ");
}

/** Separa "+54 11 12345678" en sus partes. Best-effort para datos existentes. */
function descomponer(v: string): { pais: string; area: string; numero: string } {
  const s = (v ?? "").trim();
  if (!s) return { pais: "", area: "", numero: "" };
  const partes = s.split(/\s+/);
  if (partes.length >= 3) {
    return {
      pais: partes[0],
      area: partes[1],
      numero: partes.slice(2).join(""),
    };
  }
  if (partes.length === 2) {
    return { pais: partes[0], area: "", numero: partes[1] };
  }
  // Un solo bloque: lo dejamos en número para no perder nada.
  return { pais: "", area: "", numero: s };
}
