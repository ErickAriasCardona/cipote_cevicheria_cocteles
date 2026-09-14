import { useEffect, useRef } from 'react'
import { InsumoForm } from './InsumoForm'
import { Button } from '../ui/Button'
import { IconoCruz } from '../ui/IconosFormas'
import type { ActualizarInsumoInput, CrearInsumoInput, Insumo } from '../../types/insumo'

interface InsumoCrearModalProps {
  abierto: boolean
  tiposPersonalizados?: string[]
  tiposUnidadPersonalizados?: string[]
  insumosExistentes?: Insumo[]
  onCerrar: () => void
  onCrear: (input: CrearInsumoInput) => Promise<void>
  onActualizar?: (id: string, input: ActualizarInsumoInput) => Promise<void>
}

/**
 * Diálogo "Nuevo Insumo" (ticket 2026-09-12: rediseño de InsumosPage).
 *
 * Reutiliza el mismo patrón visual de overlay que InsumoEditarModal.tsx
 * (position: fixed, background var(--modal-overlay), backdropFilter blur(6px),
 * role="dialog", aria-modal, cierre con Escape / click afuera / botón, foco
 * inicial en el botón de cerrar). A propósito NO se le pone su propio fondo de
 * "tarjeta" al contenedor del diálogo: adentro se monta <InsumoForm/> tal cual
 * (sin tocar su lógica interna), que ya se renderiza dentro de su propio
 * GlassCard -- así se evita duplicar el marco (doble borde/blur) y el
 * resultado visual es el mismo look de "tarjeta flotando sobre overlay
 * difuminado" que ya usa el resto de la app.
 *
 * Decisión de cierre automático: al crear o actualizar un insumo con éxito
 * (mismo InsumoForm que ya se usaba en la página, ahora reusado aquí para
 * también permitir editar/restockear desde el selector de nombre), el diálogo
 * se cierra solo -- el insumo recién creado ya queda visible de inmediato en
 * "Insumos Registrados" detrás del modal, que sirve como confirmación visual.
 */
export function InsumoCrearModal({
  abierto,
  tiposPersonalizados = [],
  tiposUnidadPersonalizados = [],
  insumosExistentes = [],
  onCerrar,
  onCrear,
  onActualizar,
}: InsumoCrearModalProps) {
  const cerrarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!abierto) return
    cerrarRef.current?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCerrar()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [abierto, onCerrar])

  if (!abierto) return null

  async function handleCrear(input: CrearInsumoInput) {
    await onCrear(input)
    onCerrar()
  }

  async function handleActualizar(id: string, cambios: ActualizarInsumoInput) {
    if (!onActualizar) return
    await onActualizar(id, cambios)
    onCerrar()
  }

  return (
    <div
      role="presentation"
      onClick={onCerrar}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--modal-overlay)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '40px 16px',
        zIndex: 1000,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-crear-insumo-titulo"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 760,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          animation: 'fadeInUp 0.18s ease-out',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button ref={cerrarRef} type="button" variant="secondary" size="sm" onClick={onCerrar}>
            <IconoCruz size={13} style={{ marginRight: 6 }} /> Cerrar
          </Button>
        </div>

        {/* Título accesible fuera de la vista visual: InsumoForm ya muestra su
        propio encabezado "Nuevo Insumo" / "Editar / Restock Insumo: ..."
        dentro del GlassCard, este span solo etiqueta el role="dialog". */}
        <span id="modal-crear-insumo-titulo" style={{ display: 'none' }}>
          Nuevo Insumo
        </span>

        <InsumoForm
          tiposPersonalizados={tiposPersonalizados}
          tiposUnidadPersonalizados={tiposUnidadPersonalizados}
          insumosExistentes={insumosExistentes}
          onCrear={handleCrear}
          onActualizar={onActualizar ? handleActualizar : undefined}
        />
      </div>
    </div>
  )
}
