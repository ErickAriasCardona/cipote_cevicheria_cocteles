-- Migración 3 (Poseidon, MODELO_DATOS_MVP_1.0_2026-08-30.md sección 7).
-- Tabla rol_permisos: matriz rol x recurso x accion -> permitido (RF-01.2).
-- Fuente de verdad de fn_check_permission(); ver ARQUITECTURA_MVP_1.0_2026-08-30.md
-- sección 6.1 y DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md sección 2.

create table public.rol_permisos (
  rol text not null check (rol in ('administrador', 'cajero')),
  recurso text not null,
  accion text not null check (accion in ('select', 'insert', 'update', 'delete')),
  permitido boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (rol, recurso, accion)
);

comment on table public.rol_permisos is
  'Matriz estatica de permisos MVP (RF-01.2). Deniega por defecto si no hay fila. '
  'Extensible en Fase 2 (RF-01.3) via usuario_permisos sin tocar RLS existente.';
