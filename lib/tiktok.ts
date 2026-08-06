/**
 * Normaliza lo que la empresa escriba a un handle de TikTok limpio (sin @).
 * Acepta: "handle", "@handle", "tiktok.com/@handle",
 * "https://www.tiktok.com/@handle", con o sin query string.
 * Devuelve null si no se puede extraer un handle válido.
 */
export function tiktokHandle(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;

  // Si vino como URL (con o sin protocolo), quedarse con el segmento del path.
  // En TikTok el perfil es /@handle, así que el @ puede venir en la URL.
  const conDominio = s.match(
    /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@?([^/?#]+)/i,
  );
  if (conDominio) s = conDominio[1];

  s = s.replace(/^@/, "").replace(/\/+$/, "");

  // Handle de TikTok: letras, números, punto y guion bajo (máx 24).
  return /^[A-Za-z0-9._]{1,24}$/.test(s) ? s : null;
}

/** URL pública del perfil a partir del handle ya normalizado. */
export function tiktokUrl(handle: string): string {
  return `https://tiktok.com/@${handle}`;
}
