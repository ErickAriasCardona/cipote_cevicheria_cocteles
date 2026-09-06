-- Migración 13 de Poseidon (MODELO_DATOS_MVP_1.0_2026-08-30.md secciones 2.5,
-- 3, 4, 5.3 / DICCIONARIO_DATOS_MVP_1.0_2026-08-30.md secciones 9, 10), BD-04.1.
--
-- Núcleo transaccional del MVP: `ventas` + `venta_pagos` (RF-03.2 a RF-03.6).
-- Ambas tablas quedan 🚫 total en INSERT/UPDATE/DELETE bajo RLS para los dos
-- roles de aplicación — la única forma de escribirlas es la Edge Function
-- `registrar-venta` (BD-04.2) vía `service_role`, exactamente igual que
-- `cierres_caja` (patrón ya documentado en el seed de BD-01). El
-- restablecimiento/eliminación de una venta (RF-03.6) es BD-07
-- (`eliminar-restablecer-venta`), todavía no implementado; por eso las 5
-- columnas de soft-delete de `ventas` se crean ya en esta migración (Poseidon,
-- sección 4) pero ninguna política las expone para escritura directa.
--
-- Las filas de `rol_permisos` para `ventas` y `venta_pagos` YA existen desde
-- el seed de BD-01 (20260831000006_seed_rol_permisos.sql, líneas 100-110) —
-- no se necesita una migración nueva de rol_permisos para BD-04.1.

create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  turno_id uuid not null references public.turnos_caja (id) on delete restrict,
  cajero_id uuid not null references public.usuarios_perfil (id) on delete restrict,
  producto_id uuid not null references public.productos (id) on delete restrict,
  tamano_vaso_id uuid not null references public.tamanos_vaso (id) on delete restrict,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12, 2) not null,
  total numeric(12, 2) not null check (total >= 0),
  tipo_entrega text not null check (tipo_entrega in ('para_llevar', 'consumo_lugar')),
  observaciones text,
  created_at timestamptz not null default now(),
  -- Soft-delete (RF-03.6, RN-009, cuarta ronda). Solo escritas por la futura
  -- Edge Function `eliminar-restablecer-venta` (BD-07) vía service_role.
  eliminado boolean not null default false,
  eliminado_por uuid references public.usuarios_perfil (id) on delete restrict,
  eliminado_en timestamptz,
  restablecido_por uuid references public.usuarios_perfil (id) on delete restrict,
  restablecido_en timestamptz,
  constraint ck_ventas_soft_delete_consistente check (
    (eliminado_por is null) = (eliminado_en is null)
    and (restablecido_por is null) = (restablecido_en is null)
    and (
      (eliminado = true and eliminado_por is not null)
      or (eliminado = false and (eliminado_por is null or restablecido_en is not null))
    )
  )
);

comment on table public.ventas is
  'Núcleo transaccional del MVP (RF-03.2). Inmutable de contenido desde su '
  'creación (sin updated_at genérico); precio_unitario/total son snapshot '
  'calculado por registrar-venta, nunca confiado del cliente. Sin política '
  'UPDATE para ningún rol, ni siquiera Administrador — las 5 columnas de '
  'soft-delete solo las escribe eliminar-restablecer-venta (BD-07, service_role).';

create index ix_ventas_turno on public.ventas (turno_id);
create index ix_ventas_created_at on public.ventas (created_at);
create index ix_ventas_producto on public.ventas (producto_id);
create index ix_ventas_cajero on public.ventas (cajero_id);
create index ix_ventas_eliminado on public.ventas (eliminado) where eliminado = true;

alter table public.ventas enable row level security;

-- SELECT: Administrador ve todas (fn_check_permission); Cajero solo las
-- propias (mismo patrón "propio registro" ya usado en turnos_caja/BD-03).
create policy ventas_select on public.ventas
  for select
  using (
    public.fn_check_permission(auth.uid(), 'ventas', 'select')
    or cajero_id = auth.uid()
  );

-- Deliberadamente sin política INSERT/UPDATE/DELETE (🚫 total): sin política,
-- PostgREST rechaza la operación para cualquier rol de aplicación antes de
-- tocar la fila. Solo registrar-venta (INSERT) y, más adelante,
-- eliminar-restablecer-venta (UPDATE de soft-delete) escriben esta tabla,
-- ambas vía service_role (que ignora RLS).

create table public.venta_pagos (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas (id) on delete cascade,
  metodo_pago text not null
    check (metodo_pago in ('efectivo', 'nequi', 'transferencia_qr', 'credito_rappi', 'tarjeta')),
  monto numeric(12, 2) not null check (monto > 0),
  estado_transferencia text check (estado_transferencia in ('pendiente', 'exitosa', 'rechazada_cancelada')),
  actualizado_por uuid references public.usuarios_perfil (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_venta_pagos_estado_transferencia check (
    (metodo_pago = 'transferencia_qr') = (estado_transferencia is not null)
  )
);

comment on table public.venta_pagos is
  'Pago(s) de una venta (RF-03.3/03.4, pago mixto). RN-006 (suma de montos = '
  'ventas.total) no es expresable como CHECK de una sola fila ni trigger '
  '(PD-011): se valida exclusivamente en la Edge Function registrar-venta. '
  'estado_transferencia solo aplica a metodo_pago=''transferencia_qr'' '
  '(CHECK cruzado); su cambio (HU-03.5) es Fase 2, no implementado en BD-04.';

create index ix_venta_pagos_venta on public.venta_pagos (venta_id);
create index ix_venta_pagos_estado_transferencia
  on public.venta_pagos (estado_transferencia)
  where metodo_pago = 'transferencia_qr';

alter table public.venta_pagos enable row level security;

-- SELECT: Administrador ve todos (fn_check_permission); Cajero solo los pagos
-- de sus propias ventas. venta_pagos no tiene cajero_id directo, así que la
-- "propiedad" se resuelve con EXISTS contra ventas.cajero_id.
create policy venta_pagos_select on public.venta_pagos
  for select
  using (
    public.fn_check_permission(auth.uid(), 'venta_pagos', 'select')
    or exists (
      select 1 from public.ventas
      where ventas.id = venta_pagos.venta_id
        and ventas.cajero_id = auth.uid()
    )
  );

-- Deliberadamente sin política INSERT/UPDATE/DELETE (🚫 total): solo
-- registrar-venta (INSERT) vía service_role escribe esta tabla en el MVP.
