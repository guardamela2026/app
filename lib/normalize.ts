/** Normaliza nombre de categoría/sub para comparar: trim + minúsculas + espacios colapsados. */
export function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}
