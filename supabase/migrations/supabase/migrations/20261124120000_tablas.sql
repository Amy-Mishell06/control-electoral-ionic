-- =========================================================
-- Yupana · Migración 1: tablas y restricciones (ADR-002)
-- =========================================================

-- Tipos propios
create type rol_usuario as enum ('provincial', 'coordinador_recinto', 'veedor');
create type dignidad    as enum ('alcalde', 'prefecto');
create type estado_acta as enum ('pendiente', 'registrada', 'corregida');

-- Recintos electorales (R1, R4)
create table recintos (
  id            uuid primary key default gen_random_uuid(),
  provincia     text not null default 'Pichincha',
  canton        text not null default 'Quito',
  parroquia     text not null,
  nombre        text not null,
  cantidad_jrv  int  not null check (cantidad_jrv > 0),
  latitud       double precision,
  longitud      double precision,
  creado_at     timestamptz not null default now(),
  unique (canton, nombre)
);

-- Perfil de cada usuario, enlazado a su cuenta de Supabase Auth (R2, R3)
create table perfiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  cedula                char(10) not null unique check (cedula ~ '^[0-9]{10}$'),
  nombres               text not null,
  apellidos             text not null,
  telefono              text not null check (telefono ~ '^[0-9]{10}$'),
  correo                text not null unique,
  rol                   rol_usuario not null,
  recinto_id            uuid references recintos (id),
  debe_cambiar_clave    boolean not null default true,
  correo_verificado     boolean not null default false,
  bienvenida_enviada_at timestamptz,
  creado_at             timestamptz not null default now(),
  -- el provincial no tiene recinto; los demás roles sí
  check (
    (rol = 'provincial' and recinto_id is null)
    or (rol <> 'provincial' and recinto_id is not null)
  )
);

-- Un solo coordinador por recinto (R4)
create unique index un_coordinador_por_recinto
  on perfiles (recinto_id) where rol = 'coordinador_recinto';

-- Juntas receptoras del voto (mesas)
create table juntas (
  id          uuid primary key default gen_random_uuid(),
  recinto_id  uuid not null references recintos (id) on delete cascade,
  numero      int  not null check (numero > 0),
  unique (recinto_id, numero)
);

-- Asignación de veedores a juntas, con historial (R5)
create table asignaciones (
  id            uuid primary key default gen_random_uuid(),
  junta_id      uuid not null references juntas (id) on delete cascade,
  veedor_id     uuid not null references perfiles (id),
  asignada_por  uuid references perfiles (id),
  asignada_at   timestamptz not null default now(),
  activa        boolean not null default true
);

-- Solo un veedor activo por junta
create unique index un_veedor_activo_por_junta
  on asignaciones (junta_id) where activa;

-- Organizaciones políticas y candidaturas (R1)
create table organizaciones (
  id      uuid primary key default gen_random_uuid(),
  nombre  text not null unique,
  siglas  text not null unique,
  orden   smallint not null unique
);

create table candidatos (
  id               uuid primary key default gen_random_uuid(),
  organizacion_id  uuid not null references organizaciones (id) on delete cascade,
  nombre           text not null,
  dignidad         dignidad not null,
  unique (organizacion_id, dignidad)
);

-- Actas de escrutinio (R6, R7)
create table actas (
  id                 uuid primary key default gen_random_uuid(),
  junta_id           uuid not null references juntas (id) on delete cascade,
  dignidad           dignidad not null,
  nulos              int not null check (nulos >= 0),
  blancos            int not null check (blancos >= 0),
  total_sufragantes  int not null check (total_sufragantes >= 0),
  foto_ruta          text not null,
  nitidez            numeric,                 -- valor del Laplaciano (ADR-012)
  latitud            double precision not null,
  longitud           double precision not null,
  precision_m        double precision,
  capturada_at       timestamptz not null,
  estado             estado_acta not null default 'registrada',
  version            int not null default 1,  -- sube en cada corrección (ADR-014)
  uuid_cliente       uuid unique,             -- evita duplicados al sincronizar (ADR-014)
  registrada_por     uuid not null references perfiles (id),
  registrada_at      timestamptz not null default now(),
  actualizada_at     timestamptz not null default now(),
  unique (junta_id, dignidad)                 -- una sola acta por junta y dignidad
);

-- Votos de cada organización dentro de un acta
create table votos_acta (
  acta_id          uuid not null references actas (id) on delete cascade,
  organizacion_id  uuid not null references organizaciones (id),
  votos            int  not null check (votos >= 0),
  primary key (acta_id, organizacion_id)
);

-- Auditoría de correcciones (R5, R6)
create table actas_historial (
  id                bigint generated always as identity primary key,
  acta_id           uuid not null references actas (id) on delete cascade,
  version           int  not null,
  datos_anteriores  jsonb not null,
  foto_anterior     text,
  corregida_por     uuid references perfiles (id),
  corregida_at      timestamptz not null default now()
);

-- Protección contra fuerza bruta en el login con cédula (R3)
create table intentos_login (
  cedula           char(10) primary key,
  fallidos         int not null default 0,
  bloqueado_hasta  timestamptz
);

-- RLS activado en todas las tablas: sin políticas, nadie lee ni escribe nada.
-- Las políticas por rol se agregan en la migración 2.
alter table recintos        enable row level security;
alter table perfiles        enable row level security;
alter table juntas          enable row level security;
alter table asignaciones    enable row level security;
alter table organizaciones  enable row level security;
alter table candidatos      enable row level security;
alter table actas           enable row level security;
alter table votos_acta      enable row level security;
alter table actas_historial enable row level security;
alter table intentos_login  enable row level security;