"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

// Autocompletado de direcciones con Photon (OpenStreetMap): gratis, sin key.
// Sesga por la ubicación del usuario (geolocalización del browser) para priorizar
// resultados cercanos; si la deniega, cae a un centro por defecto (CABA), que
// mantiene los resultados dentro de Argentina.
// Checkbox "No encuentro mi dirección" -> input de texto libre.

const BIAS_DEFECTO = { lat: -34.6037, lon: -58.3816 }; // CABA
const PHOTON = "https://photon.komoot.io/api/";

interface PhotonProps {
  name?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  country?: string;
}

function formatear(p: PhotonProps): string {
  const calle = p.street
    ? `${p.street}${p.housenumber ? ` ${p.housenumber}` : ""}`
    : p.name;
  const ciudad = p.city || p.town || p.village || p.municipality;
  return [calle, ciudad, p.state, p.country].filter(Boolean).join(", ");
}

export function DireccionInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [modoLibre, setModoLibre] = useState(false);
  const [q, setQ] = useState(value);
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);

  const coords = useRef<{ lat: number; lon: number } | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const box = useRef<HTMLDivElement>(null);

  // Pedir ubicación una vez (para sesgar por cercanía). Silencioso si la deniega.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        coords.current = { lat: p.coords.latitude, lon: p.coords.longitude };
      },
      () => {},
      { timeout: 5000, maximumAge: 600000 },
    );
  }, []);

  // Cerrar el desplegable al hacer click afuera.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function buscar(texto: string) {
    if (texto.trim().length < 3) {
      setSugerencias([]);
      return;
    }
    setCargando(true);
    const bias = coords.current ?? BIAS_DEFECTO;
    const url = `${PHOTON}?q=${encodeURIComponent(texto)}&limit=6&lang=default&lat=${bias.lat}&lon=${bias.lon}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const labels: string[] = (data.features ?? [])
        .map((f: { properties: PhotonProps }) => formatear(f.properties))
        .filter(Boolean);
      setSugerencias(Array.from(new Set(labels))); // sin duplicados
      setAbierto(true);
    } catch {
      setSugerencias([]);
    } finally {
      setCargando(false);
    }
  }

  function onType(texto: string) {
    setQ(texto);
    onChange(texto); // el texto tipeado ya vale como dirección aunque no elija
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => buscar(texto), 300);
  }

  function elegir(label: string) {
    setQ(label);
    onChange(label);
    setSugerencias([]);
    setAbierto(false);
  }

  function toggleLibre(checked: boolean) {
    setModoLibre(checked);
    setAbierto(false);
    setSugerencias([]);
  }

  return (
    <div>
      {modoLibre ? (
        <input
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribí tu dirección"
        />
      ) : (
        <div ref={box} style={{ position: "relative" }}>
          <input
            className="input"
            value={q}
            onChange={(e) => onType(e.target.value)}
            onFocus={() => sugerencias.length > 0 && setAbierto(true)}
            placeholder="Ej: San Martín 123"
            autoComplete="off"
          />
          {abierto && (cargando || sugerencias.length > 0) && (
            <div className="autocomplete">
              {cargando && sugerencias.length === 0 && (
                <div className="autocomplete__msg">Buscando…</div>
              )}
              {sugerencias.map((s) => (
                <button
                  type="button"
                  key={s}
                  className="autocomplete__item"
                  onClick={() => elegir(s)}
                >
                  <MapPin size={15} style={{ flexShrink: 0 }} />
                  <span>{s}</span>
                </button>
              ))}
              {sugerencias.length > 0 && (
                <div className="autocomplete__cred">Datos © OpenStreetMap</div>
              )}
            </div>
          )}
        </div>
      )}

      <label className="check">
        <input
          type="checkbox"
          checked={modoLibre}
          onChange={(e) => toggleLibre(e.target.checked)}
        />
        No encuentro mi dirección
      </label>
    </div>
  );
}
