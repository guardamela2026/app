"use client";

import { useRef, useState } from "react";

/** Alto del recuadro de ficha. Debe coincidir con el de la ficha pública
 *  (app/empresas/[id]/page.tsx) y el feed para que el encuadre sea fiel. */
export const FICHA_IMG_H = 260;

/**
 * Muestra la imagen dentro del recuadro de la ficha y deja arrastrarla para
 * elegir qué parte queda visible. La posición se expresa como object-position
 * en porcentaje (0-100 en cada eje): 50/50 es el centro, lo mismo que guarda
 * la DB por defecto. Ese mismo valor lo usa la ficha pública al renderizar.
 */
export function ImageFocus({
  src,
  posX,
  posY,
  onChange,
}: {
  src: string;
  posX: number;
  posY: number;
  onChange: (x: number, y: number) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  // Posición del puntero y del foco al empezar a arrastrar, para calcular
  // el desplazamiento relativo (no saltar al punto donde se hace click).
  const inicio = useRef({ px: 0, py: 0, x: 50, y: 50 });

  function clamp(n: number) {
    return Math.min(100, Math.max(0, n));
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!boxRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    inicio.current = { px: e.clientX, py: e.clientY, x: posX, y: posY };
    setArrastrando(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!arrastrando || !boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    // Arrastrar hacia abajo muestra la parte de ARRIBA de la imagen: por eso
    // el object-position se mueve en sentido inverso al puntero.
    const dx = ((e.clientX - inicio.current.px) / rect.width) * 100;
    const dy = ((e.clientY - inicio.current.py) / rect.height) * 100;
    onChange(clamp(inicio.current.x - dx), clamp(inicio.current.y - dy));
  }

  function onPointerUp(e: React.PointerEvent) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setArrastrando(false);
  }

  return (
    <div
      ref={boxRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "relative",
        marginTop: 10,
        width: "100%",
        height: FICHA_IMG_H,
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid var(--line)",
        cursor: arrastrando ? "grabbing" : "grab",
        touchAction: "none", // el gesto lo maneja el arrastre, no el scroll
        userSelect: "none",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Vista previa"
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${posX}% ${posY}%`,
          display: "block",
          pointerEvents: "none",
        }}
      />
      <span
        style={{
          position: "absolute",
          left: 10,
          bottom: 10,
          padding: "4px 8px",
          background: "oklch(18% 0.02 60 / 0.72)",
          color: "var(--paper)",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          pointerEvents: "none",
        }}
      >
        Arrastrá para encuadrar
      </span>
    </div>
  );
}
