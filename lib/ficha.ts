/** Campos que faltan para que una ficha sea "completa" (misma regla que la columna generada en DB). */
export function camposFaltantes(e: {
  nombre: string | null;
  telefono: string | null;
  email: string | null;
  categoria_id: string | null;
  subcategoria_id: string | null;
  imagen_url: string | null;
}): string[] {
  const faltan: string[] = [];
  if (!e.nombre?.trim()) faltan.push("nombre");
  if (!e.categoria_id) faltan.push("categoría");
  if (!e.subcategoria_id) faltan.push("sub-categoría");
  if (!e.imagen_url?.trim()) faltan.push("imagen");
  if (!e.telefono?.trim() && !e.email?.trim()) faltan.push("teléfono o email");
  return faltan;
}
