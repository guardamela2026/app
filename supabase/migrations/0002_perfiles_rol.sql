-- Guárdamela — rol de usuario (persona | empresa) sobre la tabla `profiles`
-- Ejecutar en Supabase: SQL Editor -> pegar -> Run.
--
-- IMPORTANTE: la tabla ya existe como `public.profiles` con la columna `tipo`
-- (text). Esta migración NO la crea de nuevo: agrega el trigger de alta, el
-- backfill, el helper y la policy que faltaban para que el rol funcione y para
-- que SÓLO las cuentas 'empresa' puedan crear fichas.
--
-- Valores esperados en profiles.tipo: 'persona' | 'empresa'.

-- ── Alta automática de perfil al registrarse ─────────────────────────────
-- Lee el rol desde raw_user_meta_data.rol (lo manda el signup de la app).
-- Si no viene, queda 'persona'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tipo text;
begin
  v_tipo := coalesce(new.raw_user_meta_data ->> 'rol', 'persona');
  if v_tipo not in ('persona', 'empresa') then
    v_tipo := 'persona';
  end if;
  insert into public.profiles (id, tipo)
  values (new.id, v_tipo)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Backfill: perfil para cuentas ya existentes sin fila ─────────────────
-- Cuentas que ya tienen al menos una ficha => empresa; el resto => persona.
insert into public.profiles (id, tipo)
select u.id,
       case when exists (select 1 from public.empresas e where e.owner_id = u.id)
            then 'empresa' else 'persona' end
from auth.users u
on conflict (id) do nothing;

-- ── RLS de profiles ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Cada quien lee su propio perfil.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (auth.uid() = id);

-- Alta del propio perfil desde el cliente (flujo OAuth/Google). No damos
-- UPDATE: una vez fijado, el rol no cambia desde el cliente.
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- ── Helper: ¿el usuario actual es empresa? ───────────────────────────────
create or replace function public.is_empresa()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.tipo = 'empresa'
  );
$$;

-- ── Reforzar insert de empresas: sólo cuentas 'empresa' ──────────────────
-- Arregla de raíz el bug: una 'persona' no puede crear fichas ni forzando la
-- petición, porque la base lo rechaza.
drop policy if exists empresas_insert_owner on public.empresas;
create policy empresas_insert_owner on public.empresas
  for insert to authenticated
  with check (auth.uid() = owner_id and public.is_empresa());
