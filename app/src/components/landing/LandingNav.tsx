import { Link } from 'react-router-dom'

export function LandingNav() {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 6%',
        position: 'sticky',
        top: 0,
        background: 'rgba(251, 251, 252, 0.7)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        zIndex: 30,
        borderBottom: '1px solid rgba(15, 20, 30, 0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        flexWrap: 'wrap',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src="/logo.jpeg"
          alt="Cipote Ceviche Cocteles"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            objectFit: 'cover',
            flex: 'none',
          }}
        />
        <span
          style={{
            fontFamily: "'Kaushan Script', cursive",
            fontSize: 20,
            color: '#181B22',
          }}
        >
          Cipote Ceviche Cocteles
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 26, flexWrap: 'wrap' }}>
        <a
          href="#menu"
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: '#181B22',
            textDecoration: 'none',
          }}
        >
          Menú
        </a>
        <a
          href="#pedir"
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: '#181B22',
            textDecoration: 'none',
          }}
        >
          Cómo pedir
        </a>
        <a
          href="#contacto"
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: '#181B22',
            textDecoration: 'none',
          }}
        >
          Contacto
        </a>
        <Link
          to="/login"
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: 'rgba(24, 27, 34, 0.55)',
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid rgba(15, 20, 30, 0.1)',
            background: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          POS
        </Link>
        <a
          href="#pedir"
          style={{
            padding: '10px 22px',
            borderRadius: 999,
            background: 'linear-gradient(160deg, #f1544f, #E42926 45%, #c81e1e)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13.5,
            textDecoration: 'none',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 10px 22px rgba(228, 41, 38, 0.3)',
            display: 'inline-block',
          }}
        >
          Pedir ahora
        </a>
      </div>
    </nav>
  )
}

