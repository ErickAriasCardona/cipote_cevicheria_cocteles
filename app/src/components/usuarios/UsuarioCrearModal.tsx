import { useEffect, useRef } from 'react'
import { UsuarioForm } from './UsuarioForm'
import { Button } from '../ui/Button'
import type { CrearUsuarioInput } from '../../types/usuario'

interface UsuarioCrearModalProps {
  abierto: boolean
  onCerrar: () => void
  onCrear: (input: CrearUsuarioInput) => Promise<void>
}

/**
 * Diálogo "Nuevo usuario" (ticket 2026-09-12: mismo patrón aplicado a
 * InsumoCrearModal.tsx, reusado aquí para UsuariosPage).
 *
 * Reutiliza el mismo patrón visual de overlay (position: fixed, background
 * var(--modal-overlay), backdropFilter blur(6px), role="dialog", aria-modal,
 * cierre con Escape / click afuera / botón, foco inicial en el botón de
 * cerrar). A propósito NO se le pone su propio fondo de "tarjeta" al
 * contenedor del diálogo: adentro se monta <UsuarioForm/> tal cual (sin tocar
 * su lógica interna), que ya se renderiza dentro de su propio GlassCard --
 * así se evita duplicar el marco (doble borde/blur).
 *
 * Decisión de cierre automático: al crear un usuario con éxito, el diálogo se
 * cierra solo -- el usuario recién creado ya queda visible de inmediato en
 * "Usuarios Registrados" detrás del modal, que sirve como confirmación
 * visual.
 */
export function UsuarioCrearModal({ abierto, onCerrar, onCrear }: UsuarioCrearModalProps) {
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

  async function handleCrear(input: CrearUsuarioInput) {
    await onCrear(input)
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
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
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
        aria-labelledby="modal-crear-usuario-titulo"
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
            Cerrar ✕
          </Button>
        </div>

        {/* Título accesible fuera de la vista visual: UsuarioForm ya muestra su
        propio encabezado "Nuevo usuario" dentro del GlassCard, este span solo
        etiqueta el role="dialog". */}
        <span id="modal-crear-usuario-titulo" style={{ display: 'none' }}>
          Nuevo usuario
        </span>

        <UsuarioForm onCrear={handleCrear} />
      </div>
    </div>
  )
}
