# Guárdamela

Tarjetas de contacto empresariales vía QR. Las empresas publican su ficha,
generan un QR que enlaza a su vista pública en modo lectura, y cualquier
visitante escanea y guarda esas empresas (agrupadas por categoría) sin
registrarse. Al registrarse, lo guardado en el dispositivo migra a la cuenta.

## Stack

- **Next.js** (App Router, TypeScript) — SSR para la vista pública `/empresas/{id}`.
- **Supabase Auth** — Google + email/contraseña.
- **Supabase Postgres + RLS** — permisos por `owner_id`, lectura pública de fichas completas.
- **Supabase Storage** — bucket `tarjetas` para las imágenes de ficha.
- CSS plano (estilo editorial "papel", tipografía Playfair Display).

## Puesta en marcha

### 1. Crear el proyecto Supabase

En [supabase.com](https://supabase.com) → **New project**. Anotá de
**Project Settings → API**: `Project URL` y `anon public key`.

### 2. Aplicar el schema

**SQL Editor** → pegá el contenido de
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → **Run**.
Crea tablas, RLS, policies y el bucket `tarjetas`.

> Con Supabase CLI: `supabase db push` (con el repo linkeado al proyecto).

### 3. Configurar Auth

En **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: agregá `http://localhost:3000/**`

Email/contraseña ya viene habilitado. Para **Google** (Authentication →
Providers → Google): pegá el Client ID / Secret de un OAuth Client de Google
Cloud, y en Google agregá como *Authorized redirect URI* la que muestra
Supabase (`https://TU-PROYECTO.supabase.co/auth/v1/callback`).

En producción, repetí Site URL / Redirect URLs con tu dominio real.

### 4. Variables de entorno

Copiá `.env.local.example` → `.env.local` y completá:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SITE_URL` es la base a la que apunta el QR.

### 5. Correr

```bash
npm install
npm run dev      # http://localhost:3000
```

## Modelo de datos

| Tabla           | Campos clave |
|-----------------|--------------|
| `categorias`    | `nombre`, `nombre_normalizado` (unique) |
| `subcategorias` | `categoria_id`, `nombre`, `nombre_normalizado` (unique por categoría) |
| `empresas`      | `owner_id`, contacto, `categoria_id`, `subcategoria_id`, `imagen_url`, `ficha_completa` (columna **generada**) |
| `guardados`     | `usuario_id`, `empresa_id`, `origen` (`escaneo`\|`estrella`), unique(usuario, empresa) |

- **Normalización**: categoría/sub se comparan por `trim + minúsculas + espacios colapsados` (`lib/normalize.ts`) → sin duplicados por mayúsculas/espacios. Se crean al momento si no existen (find-or-create, sin mutar el catálogo compartido).
- **`ficha_completa`**: verdadera cuando hay nombre, categoría, sub-categoría, imagen y (teléfono o email). El Feed filtra por esta columna; el QR se habilita según ella.

## Seguridad (RLS)

- `empresas`: lectura pública **sólo** de fichas completas; el dueño lee/edita/borra las suyas (`auth.uid() = owner_id`). `/empresas/{id}/edit` valida propiedad en backend (404 si no sos dueño) — no depende de ocultar el botón.
- `categorias`/`subcategorias`: lectura pública, alta autenticada.
- `guardados`: cada usuario sólo ve/gestiona los propios.
- `storage.objects` (bucket `tarjetas`): lectura pública; escritura sólo del dueño de la empresa (ruta `empresas/{empresa_id}/...`). Límite 5 MB, JPG/PNG/WEBP.

## Mapa de Historias de Usuario → código

| HU | Dónde |
|----|-------|
| HU-1 registro empresa | [`app/login`](app/login/page.tsx) |
| HU-2 carga/edición de ficha | [`app/panel`](app/panel/page.tsx), [`app/empresas/[id]/edit`](app/empresas/[id]/edit/page.tsx), [`components/ficha-editor.tsx`](components/ficha-editor.tsx) |
| HU-3 QR (habilitado si completa) | [`components/qr-panel.tsx`](components/qr-panel.tsx) |
| HU-4 ficha pública modo lectura | [`app/empresas/[id]/page.tsx`](app/empresas/[id]/page.tsx) |
| HU-5 auto-guardar al ver ficha | [`components/auto-guardar.tsx`](components/auto-guardar.tsx), [`lib/guardados.ts`](lib/guardados.ts) |
| HU-6 feed + búsqueda + estrella | [`app/page.tsx`](app/page.tsx), [`components/feed.tsx`](components/feed.tsx) |
| HU-7 registro + migración localStorage→DB | [`components/guardados-migrator.tsx`](components/guardados-migrator.tsx), `migrateLocalToDb` en [`lib/guardados.ts`](lib/guardados.ts) |
| Servicios Guardados (agrupado) | [`app/guardados/page.tsx`](app/guardados/page.tsx) |

## Notas

- Sin sesión, los guardados viven en `localStorage`; al autenticarse migran a la
  cuenta con **merge sin duplicados** y se limpia el `localStorage`. La cuenta
  queda como única fuente de verdad (también al entrar en un segundo dispositivo).
- Un visitante anónimo en dos dispositivos tendrá listas separadas hasta
  autenticarse. Comportamiento esperado.
- Fuera de alcance del MVP: generar la imagen de tarjeta dentro de la app
  (por ahora se sube), mensajería, pagos, analíticas de escaneo.


