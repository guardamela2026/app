/** URL a Google Maps para "Cómo llegar" desde una dirección de texto.
 *  Abre la app de mapas nativa en el teléfono. */
export function mapsUrl(direccion: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
}

/** Normaliza un sitio web a URL con protocolo (acepta "misitio.com"). */
export function sitioWebUrl(raw: string): string {
  const s = raw.trim();
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}
