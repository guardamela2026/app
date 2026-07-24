/**
 * Normaliza lo que la empresa escriba a un handle de Instagram limpio.
 * Acepta: "handle", "@handle", "instagram.com/handle",
 * "https://www.instagram.com/handle/", con o sin query string.
 * Devuelve null si no se puede extraer un handle válido.
 */
export function instagramHandle(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;

  // Si vino como URL (con o sin protocolo), quedarse con el primer segmento
  // del path después del dominio.
  const conDominio = s.match(
    /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?#]+)/i,
  );
  if (conDominio) s = conDominio[1];

  s = s.replace(/^@/, "").replace(/\/+$/, "");

  return /^[A-Za-z0-9._]{1,30}$/.test(s) ? s : null;
}

/** URL pública del perfil a partir del handle ya normalizado. */
export function instagramUrl(handle: string): string {
  return `https://instagram.com/${handle}`;
}
