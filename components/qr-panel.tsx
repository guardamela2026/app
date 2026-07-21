"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrPanel({
  url,
  faltan,
}: {
  url: string;
  faltan: string[];
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const habilitado = faltan.length === 0;

  useEffect(() => {
    if (!habilitado) {
      setDataUrl(null);
      return;
    }
    QRCode.toDataURL(url, { width: 320, margin: 2 }).then(setDataUrl);
  }, [url, habilitado]);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="section-title" style={{ marginTop: 0 }}>
        Código QR
      </div>
      {habilitado ? (
        <div style={{ textAlign: "center" }}>
          {dataUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={dataUrl}
              alt="Código QR de la ficha"
              width={200}
              height={200}
              style={{ borderRadius: 12, background: "#fff", padding: 8 }}
            />
          )}
          <p className="hint" style={{ marginTop: 10, wordBreak: "break-all" }}>
            {url}
          </p>
          {dataUrl && (
            <a
              className="btn btn--ghost"
              href={dataUrl}
              download="guardamela-qr.png"
              style={{ marginTop: 10 }}
            >
              Descargar QR
            </a>
          )}
        </div>
      ) : (
        <div>
          <span className="chip chip--warn">QR deshabilitado</span>
          <p className="hint" style={{ marginTop: 10 }}>
            Falta completar: {faltan.join(", ")}.
          </p>
        </div>
      )}
    </div>
  );
}
