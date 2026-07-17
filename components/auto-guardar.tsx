"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { saveEmpresa } from "@/lib/guardados";

/** HU-5: al ver una ficha pública, se guarda sola (sin duplicar). Nudge si es anónimo. */
export function AutoGuardar({ empresaId }: { empresaId: string }) {
  const [nudge, setNudge] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      await saveEmpresa(empresaId, "escaneo");
      const { data } = await createClient().auth.getSession();
      if (!cancel && !data.session) setNudge(true);
    })();
    return () => {
      cancel = true;
    };
  }, [empresaId]);

  if (!nudge) return null;

  return (
    <div className="toast" style={{ maxWidth: 420 }}>
      <div style={{ marginBottom: 8 }}>
        🔖 Guardada en este dispositivo. Registrate para no perderla nunca.
      </div>
      <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
        <button
          className="btn btn--ghost"
          style={{ color: "var(--paper)", borderColor: "var(--paper)" }}
          onClick={() => setNudge(false)}
        >
          Ahora no
        </button>
        <Link
          className="btn btn--primary"
          href={`/login?next=/empresas/${empresaId}`}
        >
          Registrarme
        </Link>
      </div>
    </div>
  );
}
