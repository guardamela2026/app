"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface SelectorOpcion {
  id: string;
  nombre: string;
}

/** Normaliza para buscar: sin acentos, minúsculas, sin espacios de sobra. */
function normaliza(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Desplegable con menú propio y búsqueda predictiva: el popup de un <select>
 * nativo lo dibuja el sistema operativo y el CSS de la página no lo alcanza,
 * así que la lista se arma con divs para que siga la estética de la app.
 *
 * Con el menú abierto, un input filtra las opciones a medida que se escribe.
 * A cambio hay que reponer a mano lo que el nativo daba gratis: roles ARIA,
 * navegación por teclado y cierre al hacer click afuera.
 */
export function Selector({
  value,
  onChange,
  opciones,
  placeholder,
  disabled = false,
  label,
}: {
  value: string;
  onChange: (id: string) => void;
  opciones: SelectorOpcion[];
  placeholder: string;
  disabled?: boolean;
  /** Para lectores de pantalla: el <label> visible no envuelve al botón. */
  label: string;
}) {
  const [abierto, setAbierto] = useState(false);
  // Opción resaltada por teclado (índice sobre la lista FILTRADA); -1 = ninguna.
  const [activo, setActivo] = useState(-1);
  const [busqueda, setBusqueda] = useState("");
  const raizRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const elegida = opciones.find((o) => o.id === value) ?? null;

  // Búsqueda predictiva: filtra por coincidencia (sin acentos). El umbral de
  // mostrar el buscador evita ruido en listas cortas.
  const mostrarBuscador = opciones.length > 6;
  const filtradas = useMemo(() => {
    const q = normaliza(busqueda);
    if (!q) return opciones;
    return opciones.filter((o) => normaliza(o.nombre).includes(q));
  }, [busqueda, opciones]);

  // Click afuera cierra. Se registra sólo con el menú abierto.
  useEffect(() => {
    if (!abierto) return;
    function onPointerDown(e: MouseEvent) {
      if (!raizRef.current?.contains(e.target as Node)) cerrar();
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  // Al abrir, foco al buscador (si existe) para poder tipear de una.
  useEffect(() => {
    if (abierto && mostrarBuscador) inputRef.current?.focus();
  }, [abierto, mostrarBuscador]);

  // Mantiene visible la opción resaltada al navegar con flechas.
  useEffect(() => {
    if (!abierto || activo < 0) return;
    listaRef.current
      ?.querySelectorAll("[role='option']")
      [activo]?.scrollIntoView({ block: "nearest" });
  }, [activo, abierto]);

  function abrir() {
    if (disabled) return;
    setBusqueda("");
    setActivo(opciones.findIndex((o) => o.id === value));
    setAbierto(true);
  }

  function cerrar() {
    setAbierto(false);
    setBusqueda("");
    setActivo(-1);
  }

  function elegir(id: string) {
    onChange(id);
    cerrar();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;

    if (!abierto) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        abrir();
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        cerrar();
        break;
      case "Tab":
        // Tab confirma y deja salir del campo (no lo bloqueamos).
        cerrar();
        break;
      case "Enter":
        e.preventDefault();
        if (activo >= 0 && filtradas[activo]) elegir(filtradas[activo].id);
        break;
      case "ArrowDown":
        e.preventDefault();
        setActivo((i) => Math.min(i + 1, filtradas.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActivo((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActivo(0);
        break;
      case "End":
        e.preventDefault();
        setActivo(filtradas.length - 1);
        break;
    }
  }

  return (
    <div className="selector" ref={raizRef}>
      <button
        type="button"
        className="selector__campo"
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={onKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={abierto ? listboxId : undefined}
        aria-label={label}
      >
        <span className={elegida ? undefined : "selector__placeholder"}>
          {elegida?.nombre ?? placeholder}
        </span>
        <svg
          className="selector__chevron"
          width="12"
          height="8"
          viewBox="0 0 12 8"
          aria-hidden="true"
        >
          <path
            d="M1 1.5 6 6.5 11 1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="square"
          />
        </svg>
      </button>

      {abierto && (
        <div className="selector__menu">
          {mostrarBuscador && (
            <input
              ref={inputRef}
              className="selector__buscar"
              type="text"
              value={busqueda}
              placeholder="Buscar…"
              aria-label={`Buscar en ${label}`}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setActivo(0); // resalta el primer resultado
              }}
              onKeyDown={onKeyDown}
            />
          )}
          <div
            className="selector__lista"
            id={listboxId}
            role="listbox"
            aria-label={label}
            ref={listaRef}
          >
            {filtradas.length === 0 ? (
              <div className="selector__vacio">Sin resultados</div>
            ) : (
              filtradas.map((o, i) => (
                <div
                  key={o.id}
                  role="option"
                  aria-selected={o.id === value}
                  className={[
                    "selector__opcion",
                    i === activo ? "is-activa" : "",
                    o.id === value ? "is-elegida" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onMouseEnter={() => setActivo(i)}
                  onClick={() => elegir(o.id)}
                >
                  {o.nombre}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
