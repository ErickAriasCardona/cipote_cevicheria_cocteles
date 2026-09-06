import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import type { ButtonVariant } from '../components/ui/Button'

export interface OpcionesConfirmacion {
  titulo?: string
  mensaje: string
  textoConfirmar?: string
  textoCancelar?: string
  varianteConfirmar?: ButtonVariant
}

interface SolicitudConfirmacion extends OpcionesConfirmacion {
  resolver: (valor: boolean) => void
}

interface ConfirmacionContextValue {
  confirmar: (opciones: OpcionesConfirmacion) => Promise<boolean>
}

const ConfirmacionContext = createContext<ConfirmacionContextValue | null>(null)

export function ConfirmacionProvider({ children }: { children: ReactNode }) {
  const [solicitud, setSolicitud] = useState<SolicitudConfirmacion | null>(null)

  const confirmar = useCallback((opciones: OpcionesConfirmacion): Promise<boolean> => {
    return new Promise((resolve) => {
      setSolicitud({ ...opciones, resolver: resolve })
    })
  }, [])

  function cerrar(valor: boolean) {
    setSolicitud((actual) => {
      actual?.resolver(valor)
      return null
    })
  }

  return (
    <ConfirmacionContext.Provider value={{ confirmar }}>
      {children}
      <ConfirmDialog
        abierto={solicitud !== null}
        titulo={solicitud?.titulo}
        mensaje={solicitud?.mensaje ?? ''}
        textoConfirmar={solicitud?.textoConfirmar}
        textoCancelar={solicitud?.textoCancelar}
        varianteConfirmar={solicitud?.varianteConfirmar}
        onConfirmar={() => cerrar(true)}
        onCancelar={() => cerrar(false)}
      />
    </ConfirmacionContext.Provider>
  )
}

export function useConfirmacion(): ConfirmacionContextValue {
  const contexto = useContext(ConfirmacionContext)
  if (!contexto) {
    throw new Error('useConfirmacion debe usarse dentro de un ConfirmacionProvider')
  }
  return contexto
}
