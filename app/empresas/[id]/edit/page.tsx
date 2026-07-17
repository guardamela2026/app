import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FichaEditor } from "@/components/ficha-editor";
import type { Categoria, Empresa, Subcategoria } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?role=empresa&next=/empresas/${id}/edit`);

  // Sólo el dueño edita: si no es suya (o no existe), 404.
  const { data: empresa } = await supabase
    .from("empresas")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!empresa) notFound();

  const [{ data: categorias }, { data: subcategorias }] = await Promise.all([
    supabase.from("categorias").select("*").order("nombre"),
    supabase.from("subcategorias").select("*").order("nombre"),
  ]);

  return (
    <div style={{ padding: "28px 0" }}>
      <Link href="/panel" className="muted">
        ← Panel
      </Link>
      <h1 style={{ margin: "10px 0 22px", fontSize: 30 }}>Editar ficha</h1>
      <FichaEditor
        empresa={empresa as Empresa}
        categorias={(categorias ?? []) as Categoria[]}
        subcategorias={(subcategorias ?? []) as Subcategoria[]}
      />
    </div>
  );
}
