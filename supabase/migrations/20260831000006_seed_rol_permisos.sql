-- Migración 6 (Poseidon, MODELO_DATOS_MVP_1.0_2026-08-30.md sección 7).
-- Seed de arranque (dato técnico, no de negocio) con la matriz COMPLETA de
-- rol_permisos descrita en la sección 5.3 del modelo de datos: las 14
-- tablas del MVP, aunque solo usuarios_perfil/rol_permisos existen todavía
-- físicamente (el resto se crea en BD-02 a BD-08). No hay FK entre
-- rol_permisos.recurso y una tabla real, por lo que sembrar ya estas filas
-- no genera ninguna dependencia rota (nota explícita de Poseidon, sección 7).
--
-- Convención de transcripción de la leyenda de la sección 5.3:
--   ✅ -> permitido = true
--   🔒 -> permitido = false (fila explícita, para auditar la matriz completa)
--   🔑 -> permitido = false en esta tabla; el acceso a la fila propia se
--         resuelve en la política RLS con una condición OR adicional
--         (usuarios_perfil.select ya implementada en la migración 5; el
--         resto de tablas 🔑 implementará el mismo patrón cuando su RLS se
--         cree en su propio bloque: BD-03/BD-04/BD-06)
--   🚫 -> sin política para ningún rol (solo service_role/Edge Function
--         puede escribir) -> NO se inserta fila: fn_check_permission nunca
--         se invoca para esa combinación tabla/acción por diseño.
--
-- turnos_caja.delete no aparece explícitamente en la tabla de la sección 5.3
-- (solo se documentan S/I/U); se interpreta como 🚫 por coherencia con el
-- resto del diseño (no existe ningún RF/RN que contemple borrar un turno) —
-- ver PLAN_DESARROLLO_2026-08-31_BD-01-fundacion-tecnica.md, no se trata como
-- inconsistencia bloqueante.

insert into public.rol_permisos (rol, recurso, accion, permitido) values
  -- usuarios_perfil (RF-01.1) ---------------------------------------------
  ('administrador', 'usuarios_perfil', 'select', true),
  ('administrador', 'usuarios_perfil', 'insert', true),
  ('administrador', 'usuarios_perfil', 'update', true),
  ('administrador', 'usuarios_perfil', 'delete', false),
  ('cajero',        'usuarios_perfil', 'select', false), -- + propio registro (RLS)
  ('cajero',        'usuarios_perfil', 'insert', false),
  ('cajero',        'usuarios_perfil', 'update', false),
  ('cajero',        'usuarios_perfil', 'delete', false),

  -- rol_permisos (RF-01.2) -------------------------------------------------
  ('administrador', 'rol_permisos', 'select', true),
  ('administrador', 'rol_permisos', 'insert', false),
  ('administrador', 'rol_permisos', 'update', false),
  ('administrador', 'rol_permisos', 'delete', false),
  ('cajero',        'rol_permisos', 'select', false),
  ('cajero',        'rol_permisos', 'insert', false),
  ('cajero',        'rol_permisos', 'update', false),
  ('cajero',        'rol_permisos', 'delete', false),

  -- productos (RF-03.1, tabla física en BD-02) ------------------------------
  ('administrador', 'productos', 'select', true),
  ('administrador', 'productos', 'insert', true),
  ('administrador', 'productos', 'update', true),
  ('administrador', 'productos', 'delete', false),
  ('cajero',        'productos', 'select', true),
  ('cajero',        'productos', 'insert', false),
  ('cajero',        'productos', 'update', false),
  ('cajero',        'productos', 'delete', false),

  -- insumos (RF-04.1, tabla física en BD-02) --------------------------------
  ('administrador', 'insumos', 'select', true),
  ('administrador', 'insumos', 'insert', true),
  ('administrador', 'insumos', 'update', true),
  ('administrador', 'insumos', 'delete', false),
  ('cajero',        'insumos', 'select', false),
  ('cajero',        'insumos', 'insert', false),
  ('cajero',        'insumos', 'update', false),
  ('cajero',        'insumos', 'delete', false),

  -- tamanos_vaso (RF-04.2, tabla física en BD-02) ---------------------------
  ('administrador', 'tamanos_vaso', 'select', true),
  ('administrador', 'tamanos_vaso', 'insert', true),
  ('administrador', 'tamanos_vaso', 'update', true),
  ('administrador', 'tamanos_vaso', 'delete', false),
  ('cajero',        'tamanos_vaso', 'select', true),
  ('cajero',        'tamanos_vaso', 'insert', false),
  ('cajero',        'tamanos_vaso', 'update', false),
  ('cajero',        'tamanos_vaso', 'delete', false),

  -- producto_receta (RF-04.3, tabla física en BD-02) ------------------------
  ('administrador', 'producto_receta', 'select', true),
  ('administrador', 'producto_receta', 'insert', true),
  ('administrador', 'producto_receta', 'update', true),
  ('administrador', 'producto_receta', 'delete', false),
  ('cajero',        'producto_receta', 'select', false),
  ('cajero',        'producto_receta', 'insert', false),
  ('cajero',        'producto_receta', 'update', false),
  ('cajero',        'producto_receta', 'delete', false),

  -- turnos_caja (RF-02.1, tabla física en BD-03) ----------------------------
  -- update/delete son 🚫 (solo service_role vía cerrar-caja): sin filas.
  ('administrador', 'turnos_caja', 'select', true),
  ('administrador', 'turnos_caja', 'insert', false),
  ('cajero',        'turnos_caja', 'select', false), -- + propio turno (RLS, BD-03)
  ('cajero',        'turnos_caja', 'insert', true),  -- + WITH CHECK cajero_id=auth.uid() (RLS, BD-03)

  -- cierres_caja (RF-02.2/02.3, tabla física en BD-06) ----------------------
  -- insert/update/delete son 🚫 (solo service_role vía cerrar-caja, RN-004): sin filas.
  ('administrador', 'cierres_caja', 'select', true),
  ('cajero',        'cierres_caja', 'select', false), -- + vía turno propio (RLS, BD-06)

  -- ventas (RF-03.2/03.6, tabla física en BD-04) ----------------------------
  -- insert/update/delete son 🚫 (solo service_role vía registrar-venta /
  -- eliminar-restablecer-venta): sin filas.
  ('administrador', 'ventas', 'select', true),
  ('cajero',        'ventas', 'select', false), -- + propias, cajero_id=auth.uid() (RLS, BD-04)

  -- venta_pagos (RF-03.3/03.4/03.5, tabla física en BD-04) ------------------
  -- insert/update/delete son 🚫 (solo service_role): sin filas.
  ('administrador', 'venta_pagos', 'select', true),
  ('cajero',        'venta_pagos', 'select', false), -- + vía venta propia (RLS, BD-04)

  -- movimientos_inventario (RF-04.3/04.4, tabla física en BD-04) -----------
  -- insert/update/delete son 🚫 (solo service_role): sin filas.
  ('administrador', 'movimientos_inventario', 'select', true),
  ('cajero',        'movimientos_inventario', 'select', false),

  -- conteo_vasos_cierre (RF-04.4, tabla física en BD-06) --------------------
  -- insert/update/delete son 🚫 (solo service_role vía cerrar-caja): sin filas.
  ('administrador', 'conteo_vasos_cierre', 'select', true),
  ('cajero',        'conteo_vasos_cierre', 'select', false), -- + vía turno propio (RLS, BD-06)

  -- gastos (RF-05.1, tabla física en BD-08) ---------------------------------
  ('administrador', 'gastos', 'select', true),
  ('administrador', 'gastos', 'insert', true),
  ('administrador', 'gastos', 'update', true),
  ('administrador', 'gastos', 'delete', false),
  ('cajero',        'gastos', 'select', false),
  ('cajero',        'gastos', 'insert', false),
  ('cajero',        'gastos', 'update', false),
  ('cajero',        'gastos', 'delete', false),

  -- categorias_gasto (RF-05.2, tabla física en BD-08) -----------------------
  -- nunca hay delete para nadie (se desactiva, no se borra).
  ('administrador', 'categorias_gasto', 'select', true),
  ('administrador', 'categorias_gasto', 'insert', true),
  ('administrador', 'categorias_gasto', 'update', true),
  ('administrador', 'categorias_gasto', 'delete', false),
  ('cajero',        'categorias_gasto', 'select', true),
  ('cajero',        'categorias_gasto', 'insert', false),
  ('cajero',        'categorias_gasto', 'update', false),
  ('cajero',        'categorias_gasto', 'delete', false);
