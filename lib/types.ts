export type GuardadoOrigen = "escaneo" | "estrella";

export type PerfilRol = "persona" | "empresa";

export interface Perfil {
  id: string;
  rol: PerfilRol;
  created_at: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  nombre_normalizado: string;
  /** Orden de presentación en los selects (menor primero). */
  orden: number;
}

export interface Subcategoria {
  id: string;
  categoria_id: string;
  nombre: string;
  nombre_normalizado: string;
  orden: number;
}

export interface Empresa {
  id: string;
  owner_id: string;
  nombre: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  /** Handle de Instagram normalizado (sin @ ni URL). */
  instagram: string | null;
  /** Handle de TikTok normalizado (sin @ ni URL). */
  tiktok: string | null;
  categoria_id: string | null;
  subcategoria_id: string | null;
  imagen_url: string | null;
  /** Foco de la imagen (object-position en %, 0-100 por eje). Default 50/50. */
  imagen_pos_x: number;
  imagen_pos_y: number;
  /** Datos opcionales que enriquecen la ficha. */
  horario: string | null;
  sitio_web: string | null;
  ficha_completa: boolean;
  created_at: string;
  updated_at: string;
}

/** Promedio y cantidad de votos de una empresa (vista empresa_rating). */
export interface EmpresaRating {
  empresa_id: string;
  promedio: number;
  votos: number;
}

/** Voto de estrellas de un usuario a una empresa (1-5). */
export interface Puntuacion {
  id: string;
  usuario_id: string;
  empresa_id: string;
  valor: number;
  created_at: string;
  updated_at: string;
}

/** Empresa con nombres de categoría/sub embebidos (join). */
export interface EmpresaExpandida extends Empresa {
  categorias: { nombre: string } | null;
  subcategorias: { nombre: string } | null;
}

export interface Guardado {
  id: string;
  usuario_id: string;
  empresa_id: string;
  origen: GuardadoOrigen;
  /** Nota privada de quien guardó: sólo la ve esa persona. */
  nota: string | null;
  created_at: string;
}
