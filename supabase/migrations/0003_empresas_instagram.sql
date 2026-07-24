-- OJO: comparte número con 0003_catalogo_cerrado.sql. Las dos se escribieron
-- en paralelo sobre el mismo padre y ambas ya están aplicadas en la base, así
-- que renumerar ahora desincronizaría el historial. Se deja el número tal cual.
-- La próxima migración debe ser 0004.

-- Instagram de la empresa. Se guarda sólo el handle normalizado (sin @, sin URL),
-- así el link público se arma siempre igual: https://instagram.com/<handle>.
alter table public.empresas
  add column if not exists instagram text;

-- Handle válido de Instagram: letras, números, punto y guion bajo (máx 30).
alter table public.empresas
  drop constraint if exists empresas_instagram_handle_chk;
alter table public.empresas
  add constraint empresas_instagram_handle_chk
  check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$');
