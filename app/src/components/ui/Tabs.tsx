import type { CSSProperties } from 'react'
import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'

export interface TabItem {
  to: string
  label: string
  end?: boolean
}

export interface TabsProps {
  items: TabItem[]
}

// Debe coincidir con el `gap` del <nav> más abajo -- se usa también para
// calcular a mano el ancho real del contenido (ver comentario de `medir()`).
const TABS_GAP = 6

export function Tabs({ items }: TabsProps) {
  const navRef = useRef<HTMLElement>(null)

  // Ticket 2026-09-12 (espaciado navbar): Erick pidió más separación entre el
  // logo y la primera tab ("Panel"), y que la última tab ("Reportes") quede
  // pegada al bloque de usuario. Eso se logra alineando las tabs a la derecha
  // (justifyContent: 'flex-end') dentro de su contenedor flexible.
  //
  // Cuidado: cuando las tabs no caben y el <nav> se vuelve scrolleable,
  // combinar justifyContent: 'flex-end' con overflow-x es un caso confirmado
  // (probado en vivo en Chrome) de comportamiento roto: el excedente queda
  // del lado "start" (izquierda, offsets negativos), pero Chrome NO lo cuenta
  // dentro de `scrollWidth` -- es decir, ni siquiera se puede detectar el
  // desborde comparando scrollWidth vs clientWidth (da igual), y esas tabs
  // (ej. "Panel") quedan clipeadas sin ninguna forma de alcanzarlas con
  // scroll. Por eso NO se puede usar `el.scrollWidth > el.clientWidth` para
  // decidir cuándo hay desborde: en vez de eso se mide a mano el ancho real
  // del contenido sumando el ancho de cada hijo + los gaps entre ellos, un
  // cálculo independiente de justifyContent. Si ese ancho real no cabe en el
  // contenedor, se cae a flex-start (el default), que sí es 100% seguro:
  // scrollLeft = 0 muestra siempre el primer item.
  const [desborda, setDesborda] = useState(false)

  useLayoutEffect(() => {
    const el = navRef.current
    if (!el) return

    function medir() {
      if (!el) return
      const hijos = Array.from(el.children) as HTMLElement[]
      if (hijos.length === 0) {
        setDesborda(false)
        return
      }
      const anchoContenido =
        hijos.reduce((acc, hijo) => acc + hijo.offsetWidth, 0) + TABS_GAP * (hijos.length - 1)
      setDesborda(anchoContenido > el.clientWidth + 1)
    }

    medir()

    const observer = new ResizeObserver(medir)
    observer.observe(el)
    return () => observer.disconnect()
  }, [items])

  // Cuando el <nav> pasa a modo "desborda" (flex-start + scroll), forzar
  // scrollLeft a 0 como salvaguarda adicional: si el <nav> venía de estar en
  // flex-end (mientras `desborda` todavía era false), ese layout previo pudo
  // haber dejado algún scroll residual. Este efecto corre después de que el
  // estilo flex-start ya se aplicó al DOM (depende de `desborda`), así que
  // garantiza que "Panel" quede visible en scrollLeft = 0 al cargar.
  useLayoutEffect(() => {
    if (!desborda) return
    const el = navRef.current
    if (el) el.scrollLeft = 0
  }, [desborda])

  return (
    // Requisito de Erick: la barra de tabs nunca debe hacer wrap a una
    // segunda línea, sin importar cuántos items tenga (9 en Administrador).
    // Si no caben todos con el padding/font-size reducidos, en vez de wrap
    // se vuelve horizontalmente scrolleable (flexWrap: 'nowrap' +
    // overflowX: 'auto', items con whiteSpace: 'nowrap' y flexShrink: 0).
    <nav
      ref={navRef}
      style={{
        display: 'flex',
        gap: TABS_GAP,
        flexWrap: 'nowrap',
        justifyContent: desborda ? 'flex-start' : 'flex-end',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'thin',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {items.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          style={({ isActive }) => {
            const base: CSSProperties = {
              padding: '7px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
              fontFamily: 'var(--sans)',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }

            if (isActive) {
              return {
                ...base,
                background:
                  'var(--sheen), linear-gradient(160deg, rgba(65, 175, 224, 0.34), rgba(65, 175, 224, 0.14))',
                color: 'var(--sec-active-color)',
                border: '1px solid rgba(65, 175, 224, 0.35)',
                boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
              }
            }

            return {
              ...base,
              background: 'var(--sec-inactive-bg)',
              color: 'var(--sec-inactive-color)',
              border: '1px solid transparent',
            }
          }}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
