import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Empresa } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getTipo(): Promise<{ userId: string; tipo: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("tipo")
    .eq("id", user.id)
    .maybeSingle();
  return { userId: user.id, tipo: data?.tipo ?? "persona" };
}

async function crearFicha() {
  "use server";
  const perfil = await getTipo();
  if (!perfil) redirect("/login?role=empresa&next=/panel");
  // Sólo empresas publican fichas (además lo bloquea la RLS).
  if (perfil.tipo !== "empresa") redirect("/panel");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("empresas")
    .insert({ owner_id: perfil.userId })
    .select("id")
    .single();
  if (error) throw error;
  redirect(`/empresas/${data.id}/edit`);
}

export default async function PanelPage() {
  const perfil = await getTipo();
  if (!perfil) redirect("/login?role=empresa&next=/panel");

  // Cuenta persona: no puede publicar fichas.
  if (perfil.tipo !== "empresa") {
    return (
      <div style={{ padding: "48px 0", maxWidth: 560 }}>
        <h1 style={{ fontSize: 30 }}>Panel</h1>
        <div className="card" style={{ padding: 22, marginTop: 20 }}>
          <span className="chip chip--warn">Cuenta persona</span>
          <p style={{ marginTop: 14, fontSize: 17, lineHeight: 1.5 }}>
            Esta cuenta es de tipo <strong>persona</strong>: sirve para guardar
            fichas, no para publicarlas. Para publicar una ficha necesitás una
            cuenta de <strong>empresa</strong>.
          </p>
          <div className="row" style={{ marginTop: 20, gap: 10 }}>
            <Link className="btn btn--ghost" href="/">
              Explorar
            </Link>
            <Link className="btn btn--ghost" href="/guardados">
              Mis guardados
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("empresas")
    .select("*")
    .eq("owner_id", perfil.userId)
    .order("created_at", { ascending: false });
  const empresas = (data ?? []) as Empresa[];

  return (
    <div style={{ padding: "28px 0" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 30 }}>Panel</h1>
          <p className="muted">Tus fichas de empresa.</p>
        </div>
        <form action={crearFicha}>
          <button className="btn btn--primary">+ Nueva ficha</button>
        </form>
      </div>

      {empresas.length === 0 ? (
        <div className="empty" style={{ marginTop: 28 }}>
          Todavía no cargaste ninguna ficha. Creá la primera con “Nueva ficha”.
        </div>
      ) : (
        <div className="grid-cards" style={{ marginTop: 24 }}>
          {empresas.map((e) => (
            <div key={e.id} className="card" style={{ padding: 18 }}>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>
                {e.nombre || "(sin nombre)"}
              </h3>
              {e.ficha_completa ? (
                <span className="chip chip--verde">Completa · pública</span>
              ) : (
                <span className="chip chip--warn">Incompleta</span>
              )}
              <div className="row" style={{ marginTop: 16, gap: 8 }}>
                <Link className="btn btn--ghost" href={`/empresas/${e.id}/edit`}>
                  Editar
                </Link>
                {e.ficha_completa && (
                  <Link className="btn btn--ghost" href={`/empresas/${e.id}`}>
                    Ver
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
