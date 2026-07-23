-- Tipo de cuenta (persona | empresa). Sólo las cuentas "empresa" publican fichas.
-- El tipo se fija al crearse el usuario (desde el metadata del signup) y NO es
-- editable desde el cliente (no hay policy de insert/update): es el límite real.

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  tipo       text not null default 'persona' check (tipo in ('persona', 'empresa')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles for select to authenticated
  using (auth.uid() = id);
-- Sin policy de INSERT/UPDATE para clientes: el tipo lo fija el trigger y queda inmutable.

-- Crea el profile al registrarse el usuario. 'empresa' sólo si el signup lo pidió;
-- cualquier otro valor (incluye OAuth sin metadata) cae en 'persona'.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, tipo)
  values (
    new.id,
    case when new.raw_user_meta_data->>'tipo' = 'empresa' then 'empresa' else 'persona' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill para usuarios ya existentes.
insert into public.profiles (id, tipo)
select id, case when raw_user_meta_data->>'tipo' = 'empresa' then 'empresa' else 'persona' end
from auth.users
on conflict (id) do nothing;

-- Helper para las policies.
create or replace function public.es_empresa(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = uid and tipo = 'empresa');
$$;

-- Sólo cuentas empresa pueden crear fichas (además de ser dueñas).
drop policy if exists empresas_insert_owner on public.empresas;
create policy empresas_insert_owner on public.empresas for insert to authenticated
  with check (auth.uid() = owner_id and public.es_empresa(auth.uid()));
