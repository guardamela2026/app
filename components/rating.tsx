"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Puntuación por estrellas (1-5). Muestra el promedio y la cantidad de votos
 * (públicos) y, si hay sesión, deja votar/editar el propio voto (RLS: uno por
 * usuario y empresa). Sin sesión, sólo lectura con un aviso.
 */
export function Rating({
  empresaId,
  promedioInicial,
  votosIniciales,
}: {
  empresaId: string;
  promedioInicial: number | null;
  votosIniciales: number;
}) {
  const [promedio, setPromedio] = useState(promedioInicial);
  const [votos, setVotos] = useState(votosIniciales);
  const [miVoto, setMiVoto] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [logueado, setLogueado] = useState<boolean | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Sesión + voto propio actual.
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setLogueado(Boolean(user));
      if (!user) return;
      const { data } = await supabase
        .from("puntuaciones")
        .select("valor")
        .eq("empresa_id", empresaId)
        .eq("usuario_id", user.id)
        .maybeSingle();
      if (data) setMiVoto(data.valor);
    })();
  }, [empresaId]);

  async function votar(valor: number) {
    if (guardando) return;
    setGuardando(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLogueado(false);
      setGuardando(false);
      return;
    }
    const anterior = miVoto;
    // upsert por (usuario, empresa): inserta o reemplaza el voto propio.
    const { error } = await supabase
      .from("puntuaciones")
      .upsert(
        { usuario_id: user.id, empresa_id: empresaId, valor },
        { onConflict: "usuario_id,empresa_id" },
      );
    if (!error) {
      setMiVoto(valor);
      // Refresca el agregado desde la vista (promedio/cantidad reales).
      const { data } = await supabase
        .from("empresa_rating")
        .select("promedio, votos")
        .eq("empresa_id", empresaId)
        .maybeSingle();
      if (data) {
        setPromedio(data.promedio);
        setVotos(data.votos);
      } else if (anterior == null) {
        setVotos((v) => v + 1);
      }
    }
    setGuardando(false);
  }

  const mostrado = hover ?? miVoto ?? 0;

  return (
    <div className="rating">
      <div className="rating__resumen">
        <Star size={18} className="rating__star-fill" />
        <strong>{promedio != null ? promedio.toFixed(1) : "—"}</strong>
        <span className="rating__votos">
          {votos === 0
            ? "sin votos"
            : `${votos} ${votos === 1 ? "voto" : "votos"}`}
        </span>
      </div>

      <div
        className="rating__estrellas"
        role="radiogroup"
        aria-label="Puntuar esta empresa"
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="rating__btn"
            role="radio"
            aria-checked={miVoto === n}
            aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
            disabled={guardando || logueado === false}
            onMouseEnter={() => setHover(n)}
            onClick={() => votar(n)}
          >
            <Star
              size={26}
              className={n <= mostrado ? "rating__star-on" : "rating__star-off"}
            />
          </button>
        ))}
      </div>

      {logueado === false && (
        <p className="hint">Iniciá sesión para puntuar.</p>
      )}
      {miVoto != null && logueado && (
        <p className="hint">Tu voto: {miVoto} ★ · tocá otra estrella para cambiarlo.</p>
      )}
    </div>
  );
}
