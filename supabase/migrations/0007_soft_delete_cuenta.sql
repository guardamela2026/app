-- Guárdamela — soft delete de cuenta con purga automática a los 30 días.
--
-- Al "eliminar", la cuenta no se borra: se marca con una fecha de purga y se
-- oculta. Dentro del plazo, el usuario puede cancelar y recuperar todo. Un
-- cron diario (pg_cron) borra de verdad las cuentas cuya fecha ya venció; el
-- borrado del usuario de auth arrastra en cascada sus datos.

-- ── 1. Marca de eliminación en el perfil ─────────────────────────────────
-- eliminacion_programada: cuándo se purgará (NULL = cuenta activa).
alter table public.profiles
  add column if not exists eliminacion_programada timestamptz;

-- ── 2. Ocultar del público las fichas de cuentas en baja ─────────────────
-- El feed lee empresas por ficha_completa; sumamos que el dueño no esté en
-- proceso de eliminación. Se reescribe la policy de lectura pública.
drop policy if exists empresas_select_public on public.empresas;
create policy empresas_select_public on public.empresas
  for select using (
    ficha_completa = true
    and not exists (
      select 1 from public.profiles p
      where p.id = empresas.owner_id
        and p.eliminacion_programada is not null
    )
  );

-- ── 3. Marcar / cancelar (las llama la app con la sesión del usuario) ─────
-- security definer + chequeo de auth.uid(): cada quien sólo actúa sobre lo suyo.

create or replace function public.programar_eliminacion_cuenta(dias int default 30)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  cuando timestamptz := now() + make_interval(days => dias);
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  update public.profiles
     set eliminacion_programada = cuando
   where id = auth.uid();
  return cuando;
end;
$$;

create or replace function public.cancelar_eliminacion_cuenta()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  update public.profiles
     set eliminacion_programada = null
   where id = auth.uid();
end;
$$;

grant execute on function public.programar_eliminacion_cuenta(int) to authenticated;
grant execute on function public.cancelar_eliminacion_cuenta() to authenticated;

-- ── 4. Purga: borra las cuentas cuya fecha ya venció ─────────────────────
-- Borra de auth.users; el resto (empresas, guardados, etc.) cae en cascada.
-- SECURITY DEFINER: corre con privilegios del owner (postgres), que puede
-- tocar auth.users. Sólo la invoca el cron, no está expuesta a la app.
create or replace function public.purgar_cuentas_vencidas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  borradas int := 0;
  r record;
begin
  for r in
    select id from public.profiles
    where eliminacion_programada is not null
      and eliminacion_programada <= now()
  loop
    delete from auth.users where id = r.id;
    borradas := borradas + 1;
  end loop;
  return borradas;
end;
$$;

-- ── 5. Cron diario (pg_cron) ─────────────────────────────────────────────
-- Requiere la extensión pg_cron habilitada en el proyecto Supabase
-- (Dashboard -> Database -> Extensions -> pg_cron). Corre a las 03:00 UTC.
create extension if not exists pg_cron;

-- Reemplaza el job si ya existía (idempotente).
select cron.unschedule('purga-cuentas-vencidas')
  where exists (select 1 from cron.job where jobname = 'purga-cuentas-vencidas');

select cron.schedule(
  'purga-cuentas-vencidas',
  '0 3 * * *',
  $$ select public.purgar_cuentas_vencidas(); $$
);
