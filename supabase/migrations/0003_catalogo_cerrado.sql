-- Guárdamela — catálogo cerrado de categorías / sub-categorías
--
-- Antes: cualquier usuario autenticado podía crear categorías (texto libre en
-- la ficha). Resultado: vocabulario duplicado e inconsistente.
-- Ahora: el catálogo es fijo. La app sólo elige de una lista; el alta la hace
-- un admin desde el SQL Editor.

-- ── 1. Cerrar la escritura ───────────────────────────────────────────────
-- Sin policy de INSERT, RLS deniega por defecto. La lectura pública se mantiene
-- (el feed y la ficha necesitan los nombres).
drop policy if exists categorias_insert_auth    on public.categorias;
drop policy if exists subcategorias_insert_auth on public.subcategorias;

-- ── 2. Orden de presentación ─────────────────────────────────────────────
-- Sin esto los <select> saldrían alfabéticos y "Otros" quedaría en el medio.
alter table public.categorias    add column if not exists orden int not null default 100;
alter table public.subcategorias add column if not exists orden int not null default 100;

-- ── 3. Seed ──────────────────────────────────────────────────────────────
-- nombre_normalizado replica lib/normalize.ts (trim + lower + espacios
-- colapsados) para que las comparaciones de la app sigan funcionando.
-- Idempotente: se puede correr de nuevo sin duplicar.

with datos(orden, categoria, subs) as (values
  (10, 'Gastronomía', array[
    'Restaurante','Cafetería','Bar / Cervecería','Panadería / Pastelería',
    'Heladería','Pizzería','Comida para llevar / Delivery',
    'Catering / Eventos','Food truck','Otro / Gastronomía']),
  (20, 'Alimentos y bebidas', array[
    'Almacén / Despensa','Verdulería / Frutería','Carnicería','Pescadería',
    'Fiambrería / Quesos','Dietética / Productos naturales',
    'Vinoteca / Bebidas','Producción artesanal','Otro / Alimentos']),
  (30, 'Salud', array[
    'Medicina general','Odontología','Kinesiología / Fisioterapia',
    'Psicología / Psiquiatría','Nutrición','Oftalmología / Óptica',
    'Laboratorio / Análisis','Farmacia','Otra especialidad médica']),
  (40, 'Bienestar y estética', array[
    'Peluquería','Barbería','Manicura / Pedicura',
    'Cosmetología / Tratamientos faciales','Masajes / Spa','Depilación',
    'Tatuajes / Piercing','Maquillaje','Otro / Estética']),
  (50, 'Deporte y fitness', array[
    'Gimnasio','Entrenamiento personal','Yoga / Pilates','Artes marciales',
    'Natación','Danza','Club / Escuela deportiva','Otro / Deporte']),
  (60, 'Educación y formación', array[
    'Clases particulares / Apoyo escolar','Idiomas','Música',
    'Cursos y capacitaciones','Jardín / Guardería','Instituto / Academia',
    'Coaching','Otro / Educación']),
  (70, 'Servicios para el hogar', array[
    'Plomería','Electricidad','Gas / Calefacción','Albañilería','Pintura',
    'Carpintería','Cerrajería','Aire acondicionado','Limpieza','Jardinería',
    'Fumigación / Control de plagas','Mudanzas / Fletes','Otro / Hogar']),
  (80, 'Construcción y reformas', array[
    'Arquitectura','Ingeniería','Constructora','Reformas / Remodelación',
    'Herrería','Vidriería','Techos / Impermeabilización','Piscinas',
    'Materiales de construcción','Otro / Construcción']),
  (90, 'Automotor', array[
    'Taller mecánico','Chapa y pintura','Gomería / Neumáticos','Lavadero',
    'Repuestos','Electricidad del automotor','Venta de vehículos',
    'Motos / Bicicletas','Grúa / Auxilio','Otro / Automotor']),
  (100, 'Tecnología', array[
    'Reparación de celulares','Reparación de computadoras',
    'Desarrollo web / Software','Diseño de aplicaciones',
    'Soporte técnico / Redes','Venta de equipos','Marketing digital',
    'Otro / Tecnología']),
  (110, 'Profesionales y asesoría', array[
    'Contabilidad','Abogacía','Escribanía / Notaría','Seguros','Inmobiliaria',
    'Consultoría / Gestión','Recursos humanos','Traducción',
    'Otro / Profesional']),
  (120, 'Comercio y tienda', array[
    'Indumentaria','Calzado','Accesorios / Joyería','Librería / Papelería',
    'Juguetería','Bazar / Hogar','Mueblería','Electrodomésticos','Ferretería',
    'Regalos / Souvenirs','Otro / Comercio']),
  (130, 'Eventos y celebraciones', array[
    'Organización de eventos','Fotografía','Video / Filmación',
    'Música en vivo / DJ','Salón de fiestas','Decoración',
    'Alquiler de mobiliario','Animación infantil','Torta / Mesa dulce',
    'Otro / Eventos']),
  (140, 'Arte y diseño', array[
    'Diseño gráfico','Diseño de interiores','Ilustración','Imprenta / Gráfica',
    'Cartelería / Señalética','Artesanías','Estudio de arte','Otro / Diseño']),
  (150, 'Mascotas', array[
    'Veterinaria','Peluquería canina','Pet shop','Paseo / Guardería',
    'Adiestramiento','Otro / Mascotas']),
  (160, 'Turismo y alojamiento', array[
    'Hotel / Hostal','Alquiler temporario','Agencia de viajes',
    'Guía turístico','Transporte turístico','Excursiones','Otro / Turismo']),
  -- 999: siempre al final de la lista.
  (999, 'Otros', array['Otro servicio'])
),
cats as (
  insert into public.categorias (nombre, nombre_normalizado, orden)
  select categoria, lower(btrim(regexp_replace(categoria, '\s+', ' ', 'g'))), orden
  from datos
  on conflict (nombre_normalizado) do update set orden = excluded.orden
  returning id, nombre_normalizado
)
insert into public.subcategorias (categoria_id, nombre, nombre_normalizado, orden)
select
  c.id,
  s.nombre,
  lower(btrim(regexp_replace(s.nombre, '\s+', ' ', 'g'))),
  s.ord * 10
from datos d
cross join lateral unnest(d.subs) with ordinality as s(nombre, ord)
join cats c
  on c.nombre_normalizado = lower(btrim(regexp_replace(d.categoria, '\s+', ' ', 'g')))
on conflict (categoria_id, nombre_normalizado) do update set orden = excluded.orden;
