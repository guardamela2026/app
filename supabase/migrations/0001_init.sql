-- Guardamela — schema inicial (MVP)
-- Ejecutar en Supabase: SQL Editor -> pegar -> Run, o `supabase db push`.

-- ── Extensiones ──────────────────────────────────────────────────────────
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ── Categorías / Sub-categorías (entidades reutilizables) ────────────────
-- nombre_normalizado = trim + lower + espacios colapsados (se calcula en la app).
create table if not exists public.categorias (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null,
  nombre_normalizado text not null unique,
  created_at         timestamptz not null default now()
);

create table if not exists public.subcategorias (
  id                 uuid primary key default gen_random_uuid(),
  categoria_id       uuid not null references public.categorias(id) on delete cascade,
  nombre             text not null,
  nombre_normalizado text not null,
  created_at         timestamptz not null default now(),
  unique (categoria_id, nombre_normalizado)
);

-- ── Empresas (ficha de contacto) ─────────────────────────────────────────
-- ficha_completa es columna generada: siempre coherente, el Feed filtra por ella.
create table if not exists public.empresas (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users(id) on delete cascade,
  nombre         text,
  telefono       text,
  email          text,
  direccion      text,
  categoria_id   uuid references public.categorias(id) on delete set null,
  subcategoria_id uuid references public.subcategorias(id) on delete set null,
  imagen_url     text,
  ficha_completa boolean generated always as (
    nombre is not null and length(btrim(nombre)) > 0
    and categoria_id is not null
    and subcategoria_id is not null
    and imagen_url is not null and length(btrim(imagen_url)) > 0
    and (
      (telefono is not null and length(btrim(telefono)) > 0)
      or (email is not null and length(btrim(email)) > 0)
    )
  ) stored,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists empresas_owner_idx     on public.empresas(owner_id);
create index if not exists empresas_categoria_idx  on public.empresas(categoria_id);
create index if not exists empresas_completa_idx    on public.empresas(ficha_completa);

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists empresas_set_updated_at on public.empresas;
create trigger empresas_set_updated_at
  before update on public.empresas
  for each row execute function public.set_updated_at();

-- ── Guardados (por visitante autenticado) ────────────────────────────────
do $$ begin
  create type public.guardado_origen as enum ('escaneo', 'estrella');
exception when duplicate_object then null; end $$;

create table if not exists public.guardados (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  origen     public.guardado_origen not null default 'escaneo',
  created_at timestamptz not null default now(),
  unique (usuario_id, empresa_id) -- sin duplicados
);
create index if not exists guardados_usuario_idx on public.guardados(usuario_id);

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.categorias    enable row level security;
alter table public.subcategorias enable row level security;
alter table public.empresas      enable row level security;
alter table public.guardados     enable row level security;

-- Categorías/sub: lectura pública (sugerencias + labels del feed), alta autenticada.
drop policy if exists categorias_select_public on public.categorias;
create policy categorias_select_public on public.categorias for select using (true);
drop policy if exists categorias_insert_auth on public.categorias;
create policy categorias_insert_auth on public.categorias for insert to authenticated with check (true);

drop policy if exists subcategorias_select_public on public.subcategorias;
create policy subcategorias_select_public on public.subcategorias for select using (true);
drop policy if exists subcategorias_insert_auth on public.subcategorias;
create policy subcategorias_insert_auth on public.subcategorias for insert to authenticated with check (true);

-- Empresas: público lee sólo fichas completas; el dueño lee/edita las suyas.
drop policy if exists empresas_select_public on public.empresas;
create policy empresas_select_public on public.empresas for select using (ficha_completa = true);
drop policy if exists empresas_select_owner on public.empresas;
create policy empresas_select_owner on public.empresas for select to authenticated using (auth.uid() = owner_id);
drop policy if exists empresas_insert_owner on public.empresas;
create policy empresas_insert_owner on public.empresas for insert to authenticated with check (auth.uid() = owner_id);
drop policy if exists empresas_update_owner on public.empresas;
create policy empresas_update_owner on public.empresas for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists empresas_delete_owner on public.empresas;
create policy empresas_delete_owner on public.empresas for delete to authenticated using (auth.uid() = owner_id);

-- Guardados: cada quien sólo ve/gestiona los propios.
drop policy if exists guardados_select_own on public.guardados;
create policy guardados_select_own on public.guardados for select to authenticated using (auth.uid() = usuario_id);
drop policy if exists guardados_insert_own on public.guardados;
create policy guardados_insert_own on public.guardados for insert to authenticated with check (auth.uid() = usuario_id);
drop policy if exists guardados_delete_own on public.guardados;
create policy guardados_delete_own on public.guardados for delete to authenticated using (auth.uid() = usuario_id);

-- ── Storage: bucket de imágenes de tarjeta ───────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tarjetas', 'tarjetas', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Ruta: empresas/{empresa_id}/tarjeta.ext  ->  foldername = {empresas, empresa_id}
drop policy if exists "tarjetas public read" on storage.objects;
create policy "tarjetas public read" on storage.objects for select
  using (bucket_id = 'tarjetas');

drop policy if exists "tarjetas owner insert" on storage.objects;
create policy "tarjetas owner insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tarjetas'
    and (storage.foldername(name))[1] = 'empresas'
    and (storage.foldername(name))[2] in (
      select id::text from public.empresas where owner_id = auth.uid()
    )
  );

drop policy if exists "tarjetas owner update" on storage.objects;
create policy "tarjetas owner update" on storage.objects for update to authenticated
  using (
    bucket_id = 'tarjetas'
    and (storage.foldername(name))[2] in (
      select id::text from public.empresas where owner_id = auth.uid()
    )
  );

drop policy if exists "tarjetas owner delete" on storage.objects;
create policy "tarjetas owner delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'tarjetas'
    and (storage.foldername(name))[2] in (
      select id::text from public.empresas where owner_id = auth.uid()
    )
  );
