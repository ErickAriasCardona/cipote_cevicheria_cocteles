-- ==============================================================================
-- MIGRACIÓN CONSOLIDADA DDL PARA PRODUCCIÓN (xnfrsqprjhiiswnhlszj)
-- CIPOTE CEVICHE & COCTELES
-- ==============================================================================
-- NOTA: Este script contiene operaciones DDL (ALTER TABLE, CREATE TABLE,
-- CREATE INDEX, CREATE TRIGGER, RLS POLICIES, FUNCIONES RPC).
-- PROHIBIDO: NO contiene ningún INSERT de productos falsos, insumos ficticios ni ventas.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. PRODUCTOS: Soporte para visualización en Carta pública
-- ------------------------------------------------------------------------------
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS en_carta BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.productos.en_carta IS
  'Indica si el producto se muestra en la carta pública de la landing page.';

DROP POLICY IF EXISTS "productos_select_publico" ON public.productos;
CREATE POLICY "productos_select_publico"
  ON public.productos
  FOR SELECT
  TO public
  USING (activo = true AND en_carta = true);

-- ------------------------------------------------------------------------------
-- 2. POLÍTICAS RLS PÚBLICAS PARA LA CARTA WEB (Landing Page)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "tamanos_vaso_select_publico" ON public.tamanos_vaso;
CREATE POLICY "tamanos_vaso_select_publico"
  ON public.tamanos_vaso
  FOR SELECT
  TO public
  USING (activo = true);

DROP POLICY IF EXISTS "producto_tamano_precio_select_publico" ON public.producto_tamano_precio;
CREATE POLICY "producto_tamano_precio_select_publico"
  ON public.producto_tamano_precio
  FOR SELECT
  TO public
  USING (activo = true);

DROP POLICY IF EXISTS "promociones_select_publico" ON public.promociones;
CREATE POLICY "promociones_select_publico"
  ON public.promociones
  FOR SELECT
  TO public
  USING (activo = true);

DROP POLICY IF EXISTS "promocion_productos_select_publico" ON public.promocion_productos;
CREATE POLICY "promocion_productos_select_publico"
  ON public.promocion_productos
  FOR SELECT
  TO public
  USING (true);

-- ------------------------------------------------------------------------------
-- 3. VENTAS: Campos para domicilios, bolsas y tapas
-- ------------------------------------------------------------------------------
ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS con_domicilio BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS valor_domicilio NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS domicilio_paga_en_entrega BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cantidad_bolsas INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cantidad_bolsas_grande INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cantidad_bolsas_mediana INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cantidad_bolsas_pequena INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cantidad_tapas INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.ventas.con_domicilio IS 'Indica si la venta incluye servicio de domicilio';
COMMENT ON COLUMN public.ventas.valor_domicilio IS 'Costo del servicio de domicilio';
COMMENT ON COLUMN public.ventas.domicilio_paga_en_entrega IS 'Indica si el domicilio se paga contra entrega al repartidor';
COMMENT ON COLUMN public.ventas.cantidad_bolsas IS 'Cantidad total de bolsas utilizadas en el pedido';
COMMENT ON COLUMN public.ventas.cantidad_bolsas_grande IS 'Cantidad de bolsas grandes utilizadas en el pedido';
COMMENT ON COLUMN public.ventas.cantidad_bolsas_mediana IS 'Cantidad de bolsas medianas utilizadas en el pedido';
COMMENT ON COLUMN public.ventas.cantidad_bolsas_pequena IS 'Cantidad de bolsas pequeñas utilizadas en el pedido';
COMMENT ON COLUMN public.ventas.cantidad_tapas IS 'Cantidad de tapas utilizadas en el pedido';

-- ------------------------------------------------------------------------------
-- 4. GASTOS: Fuente de Pago (Caja vs Administración) y Estado de Pago
-- ------------------------------------------------------------------------------
ALTER TABLE public.gastos
  ADD COLUMN IF NOT EXISTS origen TEXT NOT NULL DEFAULT 'administracion',
  ADD COLUMN IF NOT EXISTS turno_id UUID REFERENCES public.turnos_caja (id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS estado_pago TEXT NOT NULL DEFAULT 'pagado';

ALTER TABLE public.gastos
  DROP CONSTRAINT IF EXISTS ck_gastos_origen,
  DROP CONSTRAINT IF EXISTS ck_gastos_origen_turno,
  DROP CONSTRAINT IF EXISTS ck_gastos_estado_pago,
  DROP CONSTRAINT IF EXISTS gastos_estado_pago_check;

ALTER TABLE public.gastos
  ADD CONSTRAINT ck_gastos_origen CHECK (origen IN ('caja', 'administracion')),
  ADD CONSTRAINT ck_gastos_estado_pago CHECK (estado_pago IN ('pagado', 'no_pagado')),
  ADD CONSTRAINT ck_gastos_origen_turno CHECK (
    (origen = 'caja' AND turno_id IS NOT NULL) OR
    (origen = 'administracion' AND turno_id IS NULL)
  );

CREATE INDEX IF NOT EXISTS ix_gastos_turno_id ON public.gastos (turno_id);
CREATE INDEX IF NOT EXISTS ix_gastos_origen ON public.gastos (origen);
CREATE INDEX IF NOT EXISTS ix_gastos_estado_pago ON public.gastos (estado_pago);

DROP POLICY IF EXISTS gastos_select ON public.gastos;
CREATE POLICY gastos_select ON public.gastos
  FOR SELECT
  USING (
    public.fn_check_permission(auth.uid(), 'gastos', 'select')
    OR (
      origen = 'caja'
      AND EXISTS (
        SELECT 1 FROM public.turnos_caja
        WHERE turnos_caja.id = gastos.turno_id
          AND turnos_caja.cajero_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS gastos_insert ON public.gastos;
CREATE POLICY gastos_insert ON public.gastos
  FOR INSERT
  WITH CHECK (
    public.fn_check_permission(auth.uid(), 'gastos', 'insert')
    OR (
      origen = 'caja'
      AND registrado_por = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.turnos_caja
        WHERE turnos_caja.id = gastos.turno_id
          AND turnos_caja.cajero_id = auth.uid()
          AND turnos_caja.estado = 'abierto'
      )
    )
  );

DROP POLICY IF EXISTS gastos_update ON public.gastos;
CREATE POLICY gastos_update ON public.gastos
  FOR UPDATE
  USING (
    public.fn_check_permission(auth.uid(), 'gastos', 'update')
    OR (
      origen = 'caja'
      AND EXISTS (
        SELECT 1 FROM public.turnos_caja
        WHERE turnos_caja.id = gastos.turno_id
          AND turnos_caja.cajero_id = auth.uid()
          AND turnos_caja.estado = 'abierto'
      )
    )
  )
  WITH CHECK (
    public.fn_check_permission(auth.uid(), 'gastos', 'update')
    OR (
      origen = 'caja'
      AND EXISTS (
        SELECT 1 FROM public.turnos_caja
        WHERE turnos_caja.id = gastos.turno_id
          AND turnos_caja.cajero_id = auth.uid()
          AND turnos_caja.estado = 'abierto'
      )
    )
  );

-- ------------------------------------------------------------------------------
-- 5. CIERRES DE CAJA: Total de Gastos de Caja
-- ------------------------------------------------------------------------------
ALTER TABLE public.cierres_caja
  ADD COLUMN IF NOT EXISTS total_gastos_caja NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- ------------------------------------------------------------------------------
-- 6. AUDITORÍA DE GASTOS: Tabla e Historial de Ediciones
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gastos_historial_ediciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gasto_id UUID NOT NULL REFERENCES public.gastos (id) ON DELETE CASCADE,
  editado_por UUID NOT NULL REFERENCES public.usuarios_perfil (id) ON DELETE RESTRICT,
  fecha_edicion TIMESTAMPTZ NOT NULL DEFAULT now(),
  monto_anterior NUMERIC(12, 2) NOT NULL,
  monto_nuevo NUMERIC(12, 2) NOT NULL,
  descripcion_anterior TEXT NOT NULL,
  descripcion_nueva TEXT NOT NULL,
  categoria_id_anterior UUID REFERENCES public.categorias_gasto (id) ON DELETE SET NULL,
  categoria_id_nueva UUID REFERENCES public.categorias_gasto (id) ON DELETE SET NULL,
  fecha_anterior DATE,
  fecha_nueva DATE,
  origen_anterior TEXT,
  origen_nuevo TEXT,
  estado_pago_anterior TEXT,
  estado_pago_nuevo TEXT
);

CREATE INDEX IF NOT EXISTS ix_gastos_historial_gasto_id ON public.gastos_historial_ediciones (gasto_id);
CREATE INDEX IF NOT EXISTS ix_gastos_historial_fecha ON public.gastos_historial_ediciones (fecha_edicion);

ALTER TABLE public.gastos_historial_ediciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gastos_historial_select ON public.gastos_historial_ediciones;
CREATE POLICY gastos_historial_select ON public.gastos_historial_ediciones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios_perfil
      WHERE id = auth.uid() AND rol = 'administrador'
    )
  );

CREATE OR REPLACE FUNCTION public.fn_auditar_edicion_gasto()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (OLD.monto IS DISTINCT FROM NEW.monto)
     OR (OLD.descripcion IS DISTINCT FROM NEW.descripcion)
     OR (OLD.categoria_id IS DISTINCT FROM NEW.categoria_id)
     OR (OLD.fecha IS DISTINCT FROM NEW.fecha)
     OR (OLD.estado_pago IS DISTINCT FROM NEW.estado_pago)
     OR (OLD.origen IS DISTINCT FROM NEW.origen) THEN
    INSERT INTO public.gastos_historial_ediciones (
      gasto_id,
      editado_por,
      monto_anterior,
      monto_nuevo,
      descripcion_anterior,
      descripcion_nueva,
      categoria_id_anterior,
      categoria_id_nueva,
      fecha_anterior,
      fecha_nueva,
      estado_pago_anterior,
      estado_pago_nuevo,
      origen_anterior,
      origen_nuevo
    ) VALUES (
      OLD.id,
      COALESCE(auth.uid(), NEW.registrado_por),
      OLD.monto,
      NEW.monto,
      OLD.descripcion,
      NEW.descripcion,
      OLD.categoria_id,
      NEW.categoria_id,
      OLD.fecha,
      NEW.fecha,
      OLD.estado_pago,
      NEW.estado_pago,
      OLD.origen,
      NEW.origen
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_gastos_historial_edicion ON public.gastos;
CREATE TRIGGER tr_gastos_historial_edicion
  AFTER UPDATE ON public.gastos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auditar_edicion_gasto();

-- ------------------------------------------------------------------------------
-- 7. MOVIMIENTOS DE INVENTARIO: Nuevos tipos de movimiento y columna motivo
-- ------------------------------------------------------------------------------
ALTER TABLE public.movimientos_inventario
  ADD COLUMN IF NOT EXISTS motivo TEXT,
  ADD COLUMN IF NOT EXISTS observaciones TEXT;

ALTER TABLE public.movimientos_inventario
  DROP CONSTRAINT IF EXISTS movimientos_inventario_tipo_movimiento_check;

ALTER TABLE public.movimientos_inventario
  ADD CONSTRAINT movimientos_inventario_tipo_movimiento_check
  CHECK (tipo_movimiento IN (
    'inventario_inicial',
    'compra',
    'venta_receta',
    'ajuste_manual',
    'ingreso_vasos',
    'ingreso_caja',
    'reestablecimiento_turno',
    'conteo_apertura',
    'conteo_cierre',
    'venta'
  ));

DROP POLICY IF EXISTS movimientos_inventario_insert_cajero_ingreso_vasos ON public.movimientos_inventario;
CREATE POLICY movimientos_inventario_insert_cajero_ingreso_vasos ON public.movimientos_inventario
  FOR INSERT
  WITH CHECK (
    tipo_movimiento = 'ingreso_vasos'
    AND cantidad > 0
    AND EXISTS (
      SELECT 1 FROM public.turnos_caja
      WHERE turnos_caja.cajero_id = auth.uid()
        AND turnos_caja.estado = 'abierto'
    )
  );

DROP POLICY IF EXISTS movimientos_inventario_select_cajero_ingreso_vasos ON public.movimientos_inventario;
CREATE POLICY movimientos_inventario_select_cajero_ingreso_vasos ON public.movimientos_inventario
  FOR SELECT
  USING (
    tipo_movimiento = 'ingreso_vasos'
    AND (
      usuario_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.turnos_caja
        WHERE turnos_caja.cajero_id = auth.uid()
      )
    )
  );

-- ------------------------------------------------------------------------------
-- 8. AUTORIZACIÓN: Permitir lectura de insumos al rol Cajero en apertura de turno
-- ------------------------------------------------------------------------------
INSERT INTO public.rol_permisos (rol, recurso, accion, permitido)
VALUES ('cajero', 'insumos', 'select', true)
ON CONFLICT (rol, recurso, accion) DO UPDATE
SET permitido = true,
    updated_at = now();

-- ------------------------------------------------------------------------------
-- 9. TAMAÑOS DE VASO: Restricción de unicidad y vinculación con insumos reales
-- ------------------------------------------------------------------------------
ALTER TABLE public.tamanos_vaso
  DROP CONSTRAINT IF EXISTS tamanos_vaso_etiqueta_categoria_key;

ALTER TABLE public.tamanos_vaso
  ADD CONSTRAINT tamanos_vaso_etiqueta_categoria_key UNIQUE (etiqueta, categoria);

-- Enlazar los 3 tamaños de vaso existentes con los insumos reales de producción
UPDATE public.tamanos_vaso
SET insumo_id = '2db3d960-d937-4b54-93f5-945c27774829', activo = true
WHERE etiqueta = '12oz' AND categoria = 'ceviche';

UPDATE public.tamanos_vaso
SET insumo_id = '54c6ddcc-d50b-442b-b587-f04b9b3c2b7e', activo = true
WHERE etiqueta = '9oz' AND categoria = 'granizado';

UPDATE public.tamanos_vaso
SET insumo_id = 'b8b54cca-80e2-49c9-8b36-be92d3b2e570', activo = true
WHERE etiqueta = '7oz' AND categoria = 'granizado';

-- Insertar los 5 tamaños restantes vinculados a los insumos reales existentes
INSERT INTO public.tamanos_vaso (etiqueta, tipo, categoria, onzas, insumo_id, activo)
VALUES
  ('7oz', 'vaso', 'ceviche', 7, '88d806f1-2910-48eb-a773-b4b65cf2daf8', true),
  ('9oz', 'vaso', 'ceviche', 9, '721904ce-bdad-41b2-9b97-af3322c4d887', true),
  ('16oz', 'vaso', 'ceviche', 16, 'dfe967ce-260a-452e-b875-5b3855a19144', true),
  ('12oz', 'vaso', 'granizado', 12, 'bd3dc751-8e8e-441d-b932-41dc4c083e13', true),
  ('16oz', 'vaso', 'granizado', 16, '0592841b-d317-403f-a93d-237a7013574a', true)
ON CONFLICT (etiqueta, categoria) DO UPDATE
SET insumo_id = excluded.insumo_id,
    activo = true,
    onzas = excluded.onzas,
    tipo = excluded.tipo;

-- Asegurar stock del día base (15 unds) para los 8 vasos si no tienen asignado
UPDATE public.insumos
SET stock_minimo_diario = CASE WHEN COALESCE(stock_minimo_diario, 0) = 0 THEN 15 ELSE stock_minimo_diario END,
    activo = true
WHERE nombre = 'Vaso' AND tipo IN ('Ceviche/Coctel', 'Granizado');

-- ------------------------------------------------------------------------------
-- 10. FUNCIÓN RPC: Registro de ingreso de vasos por cajero (Stock del Día)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_registrar_ingreso_vasos_cajero(
  p_insumo_id UUID,
  p_cantidad INTEGER,
  p_usuario_id UUID,
  p_observaciones TEXT DEFAULT 'Ingreso de vasos para venta en turno (Stock del Día)'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_insumo RECORD;
  v_stock_dia_actual NUMERIC;
  v_nuevo_stock_dia NUMERIC;
  v_movimiento RECORD;
BEGIN
  IF p_cantidad <= 0 THEN
    RAISE EXCEPTION 'La cantidad de vasos debe ser mayor a cero';
  END IF;

  -- 1. Obtener y bloquear la fila del insumo
  SELECT id, nombre, stock_actual, stock_minimo_diario
  INTO v_insumo
  FROM public.insumos
  WHERE id = p_insumo_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insumo de vaso no encontrado: %', p_insumo_id;
  END IF;

  -- 2. Calcular stock operativo del día (prioriza cupo asignado para el día)
  IF v_insumo.stock_minimo_diario IS NOT NULL AND v_insumo.stock_minimo_diario > 0 THEN
    v_stock_dia_actual := v_insumo.stock_minimo_diario;
  ELSE
    v_stock_dia_actual := COALESCE(v_insumo.stock_actual, 0);
  END IF;

  v_nuevo_stock_dia := v_stock_dia_actual + p_cantidad;

  -- 3. Actualizar EXCLUSIVAMENTE el stock del día (stock_minimo_diario)
  -- La cajera SOLO puede ingresar inventario y SOLO se refleja en la cantidad del día.
  UPDATE public.insumos
  SET stock_minimo_diario = v_nuevo_stock_dia,
      updated_at = now()
  WHERE id = p_insumo_id;

  -- 4. Registrar movimiento inmutable de trazabilidad en Kardex
  INSERT INTO public.movimientos_inventario (
    insumo_id,
    tipo_movimiento,
    cantidad,
    stock_resultante,
    usuario_id,
    observaciones
  ) VALUES (
    p_insumo_id,
    'ingreso_vasos',
    p_cantidad,
    v_nuevo_stock_dia,
    p_usuario_id,
    COALESCE(NULLIF(TRIM(p_observaciones), ''), 'Ingreso de vasos para venta en turno (Stock del Día)')
  )
  RETURNING * INTO v_movimiento;

  RETURN jsonb_build_object(
    'id', v_movimiento.id,
    'insumo_id', v_movimiento.insumo_id,
    'tipo_movimiento', v_movimiento.tipo_movimiento,
    'cantidad', v_movimiento.cantidad,
    'stock_resultante', v_movimiento.stock_resultante,
    'usuario_id', v_movimiento.usuario_id,
    'observaciones', v_movimiento.observaciones,
    'created_at', v_movimiento.created_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_registrar_ingreso_vasos_cajero(UUID, INTEGER, UUID, TEXT) TO authenticated, anon;

COMMIT;
