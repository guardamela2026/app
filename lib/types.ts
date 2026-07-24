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
  categoria_id: string | null;
  subcategoria_id: string | null;
  imagen_url: string | null;
  ficha_completa: boolean;
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
  created_at: string;
}
