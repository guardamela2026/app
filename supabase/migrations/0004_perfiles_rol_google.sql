-- Guárdamela — fix: alta por Google (OAuth) quedaba siempre en 'persona'
--
-- Causa: el trigger handle_new_user() se dispara al crearse la fila en
-- auth.users, ANTES de que app/auth/callback/route.ts llegue a fijar el rol
-- elegido en el login. Con Google, raw_user_meta_data nunca trae 'rol' (sólo
-- lo manda el signup por email/contraseña), así que el trigger insertaba el
-- perfil con el default 'persona'. Cuando el callback intentaba corregirlo,
-- el upsert con ignoreDuplicates:true no pisaba la fila porque ya existía.
--
-- Fix: el trigger sólo inserta cuando raw_user_meta_data trae 'rol' (alta por
-- email/contraseña). En OAuth, no inserta nada y deja el alta en manos del
-- callback, que sí conoce el rol elegido en el front.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tipo text;
begin
  -- Sin 'rol' en la metadata (caso Google/OAuth), no inserta: el callback
  -- (app/auth/callback/route.ts) se encarga del alta con el rol correcto.
  if not (new.raw_user_meta_data ? 'rol') then
    return new;
  end if;

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
