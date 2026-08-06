import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EliminarCuenta } from "@/components/eliminar-cuenta";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mi cuenta · Guárdamela",
};

export default async function CuentaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/cuenta");

  return (
    <div style={{ maxWidth: 560, margin: "40px auto", padding: "0 4px" }}>
      <h1 style={{ fontSize: 30, marginBottom: 6 }}>Mi cuenta</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        {user.email}
      </p>

      <EliminarCuenta />
    </div>
  );
}
