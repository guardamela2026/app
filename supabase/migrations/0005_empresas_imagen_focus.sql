-- Foco de la imagen de ficha: qué parte se ve dentro del recuadro recortado.
-- Se guarda como object-position en porcentaje (0-100 por eje). 50/50 = centro,
-- el default de siempre, así las fichas existentes no cambian de encuadre.
alter table public.empresas
  add column if not exists imagen_pos_x numeric not null default 50,
  add column if not exists imagen_pos_y numeric not null default 50;

alter table public.empresas
  drop constraint if exists empresas_imagen_pos_chk;
alter table public.empresas
  add constraint empresas_imagen_pos_chk
  check (
    imagen_pos_x between 0 and 100
    and imagen_pos_y between 0 and 100
  );
