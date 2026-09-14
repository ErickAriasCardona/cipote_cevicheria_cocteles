export function LandingHero() {
  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        minHeight: '82vh',
        display: 'flex',
        alignItems: 'center',
        padding: '70px 6% 90px',
        maxWidth: 1180,
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Aves estilizadas flotando */}
      <svg
        width="26"
        height="14"
        viewBox="0 0 16 8"
        style={{
          position: 'absolute',
          top: 64,
          left: '8%',
          opacity: 0.4,
          animation: 'birdFloat1 7s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      >
        <path
          d="M0 6 Q4 0 8 6 Q12 0 16 6"
          stroke="#0d3a52"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <svg
        width="20"
        height="11"
        viewBox="0 0 16 8"
        style={{
          position: 'absolute',
          top: 110,
          left: '22%',
          opacity: 0.3,
          animation: 'birdFloat2 9s ease-in-out infinite 0.6s',
          pointerEvents: 'none',
        }}
      >
        <path
          d="M0 6 Q4 0 8 6 Q12 0 16 6"
          stroke="#0d3a52"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <svg
        width="22"
        height="12"
        viewBox="0 0 16 8"
        style={{
          position: 'absolute',
          top: 40,
          right: '14%',
          opacity: 0.35,
          animation: 'birdFloat3 8s ease-in-out infinite 0.3s',
          pointerEvents: 'none',
        }}
      >
        <path
          d="M0 6 Q4 0 8 6 Q12 0 16 6"
          stroke="#41AFE0"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 40,
          alignItems: 'center',
          width: '100%',
        }}
      >
        <div style={{ animation: 'fadeInUp 0.8s ease both' }}>
          <h1
            style={{
              fontSize: 'clamp(34px, 4.6vw, 52px)',
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '-1px',
              margin: '0 0 18px',
              color: 'var(--text-primary)',
            }}
          >
            Ceviche fresco, sabor bien cipote
          </h1>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              maxWidth: 420,
              margin: '0 0 30px',
            }}
          >
            Camarón y limón al momento, en vaso o para compartir. Pide en el local o para llevar.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <a
              href="#pedir"
              style={{
                padding: '14px 26px',
                borderRadius: 999,
                background: 'linear-gradient(160deg, #f1544f, #E42926 45%, #c81e1e)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14.5,
                textDecoration: 'none',
                boxShadow:
                  'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 14px 30px rgba(228, 41, 38, 0.35)',
                display: 'inline-block',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              }}
            >
              Pedir ahora
            </a>
            <a
              href="#menu"
              style={{
                padding: '14px 26px',
                borderRadius: 999,
                background: 'var(--tabs-wrap-bg)',
                border: '1px solid var(--tabs-wrap-border)',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: 14.5,
                textDecoration: 'none',
                boxShadow: 'inset 0 1px 0 var(--pill-highlight)',
                display: 'inline-block',
                transition: 'transform 0.25s ease',
              }}
            >
              Ver menú
            </a>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            animation: 'fadeInUp 0.8s ease 0.15s both, floatY 5.5s ease-in-out infinite',
          }}
        >
          <div
            data-tilt="1"
            style={{
              position: 'relative',
              width: 'min(380px, 80vw)',
              aspectRatio: '1/1',
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow:
                '0 30px 60px rgba(15, 20, 30, 0.18), inset 0 0 0 8px rgba(255, 255, 255, 0.5)',
              transition: 'transform 0.15s ease-out',
            }}
          >
            <img
              src="/landing/coctel_003.jpg"
              alt="Foto del ceviche estrella"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </div>
      </div>

      {/* Ola decorativa inferior */}
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          bottom: -1,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100vw',
          height: 70,
          pointerEvents: 'none',
        }}
      >
        <path
          d="M0,50 C120,90 240,10 360,50 C480,90 600,10 720,50 C840,90 960,10 1080,50 C1200,90 1320,10 1440,50 L1440,100 L0,100 Z"
          fill="#5CC2EE"
          opacity={0.3}
        />
        <path
          d="M0,70 C120,30 240,100 360,70 C480,30 600,100 720,70 C840,30 960,100 1080,70 C1200,30 1320,100 1440,70 L1440,100 L0,100 Z"
          fill="#0d3a52"
          opacity={0.4}
        />
      </svg>
    </section>
  )
}

