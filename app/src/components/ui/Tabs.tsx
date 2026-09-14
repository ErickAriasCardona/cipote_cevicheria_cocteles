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
const TABS_GAP = 4

export function Tabs({ items }: TabsProps) {
  const navRef = useRef<HTMLElement>(null)

  // Las tabs se centran dentro de su contenedor para mantener un balance visual
  // simétrico y proporcional en el topnavbar.
  //
  // Cuidado: cuando las tabs no caben y el <nav> se vuelve scrolleable,
  // medir a mano el ancho real del contenido permite activar flex-start
  // de modo seguro para garantizar que scrollLeft = 0 muestre siempre el
  // primer item ("Panel") sin clipear texto ni offsets negativos.
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
  // scrollLeft a 0 como salvaguarda adicional.
  useLayoutEffect(() => {
    if (!desborda) return
    const el = navRef.current
    if (el) el.scrollLeft = 0
  }, [desborda])

  return (
    // Requisito: la barra de tabs nunca debe hacer wrap a una segunda línea.
    // Con dimensiones optimizadas y alineación centrada se asegura visualización
    // completa de todos los items (Panel...Reportes).
    <nav
      ref={navRef}
      className="pos-tabs-nav"
      style={{
        justifyContent: desborda ? 'flex-start' : 'center',
      }}
    >
      {items.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => ['pos-tab-link', isActive ? 'active' : ''].filter(Boolean).join(' ')}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
