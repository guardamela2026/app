-- TikTok de la empresa. Igual que instagram: se guarda sólo el handle
-- normalizado (sin @, sin URL); el link se arma como https://tiktok.com/@handle.
alter table public.empresas
  add column if not exists tiktok text;

-- Handle válido de TikTok: letras, números, punto y guion bajo (máx 24).
alter table public.empresas
  drop constraint if exists empresas_tiktok_handle_chk;
alter table public.empresas
  add constraint empresas_tiktok_handle_chk
  check (tiktok is null or tiktok ~ '^[A-Za-z0-9._]{1,24}$');
