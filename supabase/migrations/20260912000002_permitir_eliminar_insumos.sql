-- Migración: Habilitar eliminación de insumos para Administrador (ticket
-- post-MVP: "el módulo de Insumos no permite eliminar").
--
-- La política RLS `insumos_delete` (public.insumos, for delete) ya existe
-- desde 20260904000002_catalogo_insumos.sql y ya llama a
-- fn_check_permission(auth.uid(), 'insumos', 'delete') — mismo mecanismo
-- uniforme de las 14 tablas del modelo (rol_permisos + fn_check_permission).
-- Lo único que faltaba, igual que en productos (20260905000008), era
-- habilitar el permiso en rol_permisos: la fila existía sembrada en
-- permitido=false para ambos roles (20260831000006_seed_rol_permisos.sql).
--
-- Decisión eliminación física vs. soft-delete (mismo criterio que productos):
-- insumos ya tiene `activo` para desactivar (soft-delete funcional, usado por
-- el icono de encender/apagar en InsumosTable). Para el DELETE físico no se
-- necesita una función RPC especial (a diferencia de usuarios, que requiere
-- tocar auth.users vía SECURITY DEFINER): un DELETE directo bajo RLS es
-- suficiente porque las tablas que referencian insumos.id ya declaran
-- `on delete restrict` (tamanos_vaso.insumo_id, movimientos_inventario.insumo_id,
-- producto_receta.insumo_id). Si el insumo tiene movimientos de inventario,
-- aparece en una receta o está mapeado 1:1 a un tamaño de vaso, PostgreSQL
-- rechaza el DELETE con foreign_key_violation (23503) y el frontend traduce
-- ese error a un mensaje amigable que sugiere desactivar el insumo en su
-- lugar (mismo patrón que productosService.eliminarProducto).
--
-- No se requiere ninguna migración de esquema adicional ni nueva política:
-- solo se abre el permiso para el rol administrador.

update public.rol_permisos
set permitido = true
where rol = 'administrador'
  and recurso = 'insumos'
  and accion = 'delete';
