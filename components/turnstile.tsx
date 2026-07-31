"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";

// API del widget de Cloudflare que inyecta el script oficial.
declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Carga el script de Turnstile una sola vez (compartido entre montajes). */
function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  const existente = document.querySelector<HTMLScriptElement>(
    `script[src="${SCRIPT_SRC}"]`,
  );
  if (existente) {
    return new Promise((res) => existente.addEventListener("load", () => res()));
  }
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => res();
    s.onerror = () => rej(new Error("No se pudo cargar Turnstile"));
    document.head.appendChild(s);
  });
}

export interface TurnstileHandle {
  /** Vuelve a lanzar el desafío (p. ej. tras un intento de login fallido). */
  reset: () => void;
}

/**
 * Widget de Cloudflare Turnstile. Entrega el token por `onToken` (y null al
 * expirar o fallar). El token se manda a Supabase como `captchaToken`.
 *
 * Si no hay site key configurada, no renderiza nada y avisa por `onToken(null)`
 * para que el form pueda decidir si bloquea o deja pasar.
 */
export const Turnstile = forwardRef<
  TurnstileHandle,
  { onToken: (token: string | null) => void }
>(function Turnstile({ onToken }, ref) {
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
    },
  }));

  useEffect(() => {
    if (!siteKey || !boxRef.current) return;
    let cancelado = false;

    loadScript()
      .then(() => {
        if (cancelado || !boxRef.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(boxRef.current, {
          sitekey: siteKey,
          theme: "light",
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(null),
          "error-callback": () => onToken(null),
        });
      })
      .catch(() => onToken(null));

    return () => {
      cancelado = true;
      if (widgetId.current) {
        window.turnstile?.remove(widgetId.current);
        widgetId.current = null;
      }
    };
    // onToken se re-crea en cada render del padre; sólo queremos montar una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) return null;

  return <div ref={boxRef} style={{ marginBottom: 12 }} />;
});
