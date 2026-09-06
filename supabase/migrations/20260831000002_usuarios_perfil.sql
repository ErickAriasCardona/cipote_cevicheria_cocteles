-- Migración 2 (Poseidon, MODELO_DATOS_MVP_1.0_2026-08-30.md sección 7).
-- Tabla usuarios_perfil: perfil 1:1 con auth.users (RF-01.1).
-- Ver DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 1 para el detalle
-- columna por columna que esta migración implementa literalmente.

create table public.usuarios_perfil (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre_completo text not null,
  rol text not null check (rol in ('administrador', 'cajero')),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.usuarios_perfil is
  'Perfil de aplicación 1:1 con auth.users. rol y activo gobiernan RF-01.1/RF-01.2.';

create index ix_usuarios_perfil_rol on public.usuarios_perfil (rol);
