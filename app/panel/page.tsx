import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioConRol } from "@/lib/perfil";
import type { Empresa } from "@/lib/types";

export const dynamic = "force-dynamic";

async function crearFicha() {
  "use server";
  const { userId, rol } = await getUsuarioConRol();
  if (!userId) redirect("/login?role=empresa&next=/panel");
  // Sólo las cuentas 'empresa' pueden publicar fichas. La RLS también lo
  // exige, pero cortamos acá para no depender sólo de la base.
  if (rol !== "empresa") redirect("/panel");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("empresas")
    .insert({ owner_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  redirect(`/empresas/${data.id}/edit`);
}

export default async function PanelPage() {
  const { userId, rol } = await getUsuarioConRol();
  if (!userId) redirect("/login?role=empresa&next=/panel");
  const esEmpresa = rol === "empresa";
  const supabase = await createClient();
  const user = { id: userId };

  const { data } = await supabase
    .from("empresas")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  const empresas = (data ?? []) as Empresa[];

  if (!esEmpresa) {
    return (
      <div style={{ padding: "28px 0" }}>
        <h1 style={{ fontSize: 30 }}>Panel</h1>
        <div className="empty" style={{ marginTop: 24 }}>
          <p style={{ marginBottom: 8 }}>
            🙋 Tu cuenta es de <strong>persona</strong>.
          </p>
          <p className="muted">
            El panel de empresa es para publicar fichas. Con tu cuenta podés
            explorar y guardar fichas, pero no crear las tuyas. Si querés
            publicar, registrá una cuenta de empresa.
          </p>
          <div className="row" style={{ marginTop: 16, gap: 8 }}>
            <Link className="btn btn--primary" href="/">
              Explorar fichas
            </Link>
            <Link className="btn btn--ghost" href="/guardados">
              Mis guardados
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
