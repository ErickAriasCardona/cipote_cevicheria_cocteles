import type { CSSProperties } from 'react'
import { NavLink } from 'react-router-dom'

export interface TabItem {
  to: string
  label: string
  end?: boolean
}

export interface TabsProps {
  items: TabItem[]
}

export function Tabs({ items }: TabsProps) {
  return (
    <nav
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 24,
      }}
    >
      {items.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          style={({ isActive }) => {
            const base: CSSProperties = {
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
              fontFamily: 'var(--sans)',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
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
