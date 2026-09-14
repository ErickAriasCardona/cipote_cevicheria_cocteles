import { WHATSAPP_NUMBER } from '../../config/landing'
import { IconoWhatsApp } from '../ui/IconosFormas'

export function LandingFooter() {
  return (
    <footer
      id="contacto"
      style={{
        position: 'relative',
        background: 'var(--footer-bg, #0B192C)',
        color: '#E0F2FE',
        paddingTop: 60,
        paddingBottom: 40,
        marginTop: 60,
        overflow: 'hidden',
      }}
    >
      {/* Onda superior */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          overflow: 'hidden',
          lineHeight: 0,
        }}
      >
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          style={{
            position: 'relative',
            display: 'block',
            width: 'calc(100% + 1.3px)',
            height: 36,
            color: 'var(--card-bg)',
          }}
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 40,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Brand info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <img
              src="/logo.jpeg"
              alt="Cipote Logo"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.2)',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--brand-font)',
                fontSize: 22,
                color: '#fff',
              }}
            >
              Cipote Ceviche Cocteles
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: '#94A3B8' }}>
            La mejor tradición de cócteles y ceviches de la costa colombiana. Frescura inigualable,
            recetas caseras y pasión por el mar en cada porción.
          </p>
        </div>

        {/* Horarios & Atención */}
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#fff' }}>
            Horarios de Atención
          </h4>
          <p style={{ margin: '0 0 6px', fontSize: 13.5, color: '#94A3B8' }}>
            <strong>Lunes a Viernes:</strong> 11:00 AM – 9:00 PM
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 13.5, color: '#94A3B8' }}>
            <strong>Sábados y Domingos:</strong> 10:30 AM – 10:00 PM
          </p>
          <p style={{ margin: 0, fontSize: 13, color: '#41AFE0', fontWeight: 600 }}>
            Domicilios activos toda la jornada
          </p>
        </div>

        {/* Contacto directo */}
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#fff' }}>
            Pedidos & Contacto
          </h4>
          <p style={{ margin: '0 0 8px', fontSize: 13.5, color: '#94A3B8' }}>
            ¿Tienes dudas, eventos o pedidos especiales?
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 999,
              background: '#2E9E5B',
              color: '#fff',
              textDecoration: 'none',
              fontSize: 13.5,
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(46, 158, 91, 0.4)',
            }}
          >
            <IconoWhatsApp size={18} />
            <span>Escribir al WhatsApp (+57 314 549 9206)</span>
          </a>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: '40px auto 0',
          padding: '20px 24px 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 12.5,
          color: '#64748B',
        }}
      >
        <span>© {new Date().getFullYear()} Cipote Ceviche Cocteles. Todos los derechos reservados.</span>
        <span>Hecho con amor y sabor a costa</span>
      </div>
    </footer>
  )
}
