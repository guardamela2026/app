-- Guárdamela — puntuaciones (estrellas) + nota privada + datos extra de empresa
--
-- Tres cosas:
--   1. empresas: horario y sitio_web (opcionales, para enriquecer la ficha).
--   2. guardados.nota: apunte privado de quien guardó (sólo lo ve esa persona).
--   3. puntuaciones: 1-5 estrellas, un voto por (usuario, empresa), editable.

-- ── 1. Datos extra de la empresa ─────────────────────────────────────────
alter table public.empresas
  add column if not exists horario   text,
  add column if not exists sitio_web text;

-- ── 2. Nota privada en el guardado ───────────────────────────────────────
-- Vive en `guardados` porque pertenece a la relación persona↔empresa, no a la
-- empresa. La RLS de guardados (auth.uid() = usuario_id) ya la aísla por dueño.
alter table public.guardados
  add column if not exists nota text;

alter table public.guardados
  drop constraint if exists guardados_nota_len_chk;
alter table public.guardados
  add constraint guardados_nota_len_chk
  check (nota is null or length(nota) <= 500);

-- ── 3. Puntuaciones ──────────────────────────────────────────────────────
create table if not exists public.puntuaciones (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  valor      smallint not null check (valor between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (usuario_id, empresa_id) -- un voto por persona y empresa
);
create index if not exists puntuaciones_empresa_idx on public.puntuaciones(empresa_id);

drop trigger if exists puntuaciones_set_updated_at on public.puntuaciones;
create trigger puntuaciones_set_updated_at
  before update on public.puntuaciones
  for each row execute function public.set_updated_at();

-- Promedio + cantidad por empresa, legible por cualquiera (la ficha lo muestra).
-- security_invoker: respeta la RLS de quien consulta.
create or replace view public.empresa_rating
with (security_invoker = true) as
  select
    empresa_id,
    round(avg(valor)::numeric, 1) as promedio,
    count(*)::int                 as votos
  from public.puntuaciones
  group by empresa_id;

-- ── RLS de puntuaciones ──────────────────────────────────────────────────
alter table public.puntuaciones enable row level security;

-- Lectura pública: el promedio/cantidad se muestra en la ficha a cualquiera.
drop policy if exists puntuaciones_select_public on public.puntuaciones;
create policy puntuaciones_select_public on public.puntuaciones
  for select using (true);

-- Sólo un usuario autenticado inserta/edita/borra SU propio voto.
drop policy if exists puntuaciones_insert_own on public.puntuaciones;
create policy puntuaciones_insert_own on public.puntuaciones
  for insert to authenticated with check (auth.uid() = usuario_id);
drop policy if exists puntuaciones_update_own on public.puntuaciones;
create policy puntuaciones_update_own on public.puntuaciones
  for update to authenticated using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
drop policy if exists puntuaciones_delete_own on public.puntuaciones;
create policy puntuaciones_delete_own on public.puntuaciones
  for delete to authenticated using (auth.uid() = usuario_id);
