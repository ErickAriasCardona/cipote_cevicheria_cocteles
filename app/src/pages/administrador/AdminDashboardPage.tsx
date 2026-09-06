import { Link } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell'
import { GlassCard } from '../../components/ui/GlassCard'

interface AdminModuleCard {
  to: string
  title: string
  desc: string
  tint: 'blue' | 'red' | 'green' | 'navy'
  icon: React.ReactNode
}

const ADMIN_MODULES: AdminModuleCard[] = [
  {
    to: '/administrador/usuarios',
    title: 'Usuarios y roles',
    desc: 'Control de acceso, roles y estados del personal',
    tint: 'blue',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: '/administrador/productos',
    title: 'Productos y precios',
    desc: 'Catálogo oficial y configuración de precios por tamaño',
    tint: 'red',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    to: '/administrador/insumos',
    title: 'Insumos e inventario',
    desc: 'Existencias físicas e inventario inicial de vasos',
    tint: 'green',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    to: '/administrador/receta',
    title: 'Receta evolutiva',
    desc: 'Insumos asociados y condiciones por preparación',
    tint: 'navy',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    to: '/administrador/ventas',
    title: 'Ventas',
    desc: 'Historial, trazabilidad, eliminar y restablecer ventas',
    tint: 'red',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    to: '/administrador/cierres-caja',
    title: 'Cierres de caja',
    desc: 'Consulta de arqueos definitivos y control de vasos',
    tint: 'navy',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    to: '/administrador/gastos',
    title: 'Gastos y categorías',
    desc: 'Registro de egresos operativos y catálogo de conceptos',
    tint: 'green',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    to: '/administrador/reportes-ventas',
    title: 'Reportes de ventas',
    desc: 'Métricas y totales agrupados por día, semana o mes',
    tint: 'blue',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
]

/**
 * Panel del Administrador (BD-01.1).
 * Grid de 8 módulos con tarjetas interactivas Liquid Glass.
 */
export function AdminDashboardPage() {
  return (
    <AppShell hideTabs>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            margin: '0 0 6px',
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: '-0.3px',
            color: 'var(--text-primary)',
          }}
        >
          Panel Administrador
        </h1>
        <p style={{ margin: 0, fontSize: 14.5, color: 'var(--text-secondary)' }}>
          Gestión de usuarios, catálogos y operación general del negocio.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        {ADMIN_MODULES.map((mod) => (
          <Link
            key={mod.to}
            to={mod.to}
            style={{
              textDecoration: 'none',
              display: 'flex',
            }}
          >
            <GlassCard
              tint={mod.tint}
              padding="22px 24px"
              style={{
                width: '100%',
                minHeight: 150,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ opacity: 0.9 }}>{mod.icon}</div>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--text-faint)',
                  }}
                >
                  →
                </span>
              </div>

              <div>
                <h2
                  style={{
                    margin: '14px 0 4px',
                    fontSize: 16.5,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {mod.title}
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12.5,
                    lineHeight: 1.4,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {mod.desc}
                </p>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}
