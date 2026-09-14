export function LandingServices() {
  return (
    <section
      id="pedir"
      style={{
        position: 'relative',
        minHeight: '56vh',
        display: 'flex',
        alignItems: 'center',
        padding: '90px 6% 90px',
        maxWidth: 1180,
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Ola superior de la sección de servicios */}
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          top: -1,
          left: '50%',
          transform: 'translateX(-50%) scaleY(-1)',
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

      {/* Contenedor tipo Glass Card */}
      <div
        style={{
          width: '100%',
          background:
            'linear-gradient(165deg, rgba(255,255,255,0.55), rgba(255,255,255,0.25))',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          border: '1px solid rgba(15,20,30,0.07)',
          borderRadius: 26,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 16px 40px rgba(15,20,30,0.08)',
          padding: '40px 6%',
        }}
      >
        <h2
          style={{
            textAlign: 'center',
            fontSize: 'clamp(22px, 2.6vw, 28px)',
            fontWeight: 800,
            letterSpacing: '-0.4px',
            margin: '0 0 30px',
            color: '#181B22',
          }}
        >
          Nuestros servicios
        </h2>

        <div className="landing-services-grid">
          {/* 1. Pedido en línea */}
          <div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                margin: '0 auto 12px',
                background:
                  'linear-gradient(160deg, rgba(65,175,224,0.3), rgba(65,175,224,0.1))',
                border: '1px solid rgba(65,175,224,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 20 20"
                fill="none"
                stroke="#0d3a52"
                strokeWidth="1.6"
              >
                <rect x="3" y="2" width="14" height="16" rx="2" />
                <path d="M8 15h4" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#181B22', display: 'block', lineHeight: 1.3 }}>
              Pedido en línea
            </span>
          </div>

          {/* 2. Domicilios */}
          <div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                margin: '0 auto 12px',
                background:
                  'linear-gradient(160deg, rgba(228,41,38,0.26), rgba(228,41,38,0.08))',
                border: '1px solid rgba(228,41,38,0.32)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#c81e1e"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="5.5" cy="17.5" r="2.5" />
                <circle cx="18.5" cy="17.5" r="2.5" />
                <path d="M15 6h-2a2 2 0 0 0-2 2v3l-3 4h4.5l2-3.5h3.5" />
                <path d="M17 9h2.5a1.5 1.5 0 0 1 1.5 1.5v3" />
                <rect x="7" y="8" width="4" height="4" rx="1" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#181B22', display: 'block', lineHeight: 1.3 }}>
              Domicilios
            </span>
          </div>

          {/* 3. Consumo en el lugar */}
          <div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                margin: '0 auto 12px',
                background:
                  'linear-gradient(160deg, rgba(65,175,224,0.24), rgba(65,175,224,0.08))',
                border: '1px solid rgba(65,175,224,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 20 20"
                fill="none"
                stroke="#0d3a52"
                strokeWidth="1.6"
              >
                <path d="M4 4h12v13H4z" />
                <path d="M4 8h12" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#181B22', display: 'block', lineHeight: 1.3 }}>
              Consumo en el lugar
            </span>
          </div>

          {/* 4. Para llevar */}
          <div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                margin: '0 auto 12px',
                background:
                  'linear-gradient(160deg, rgba(46,158,91,0.26), rgba(46,158,91,0.08))',
                border: '1px solid rgba(46,158,91,0.32)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 20 20"
                fill="none"
                stroke="#1f8a4c"
                strokeWidth="1.6"
              >
                <path d="M3 6.5l7-3.5 7 3.5-7 3.5-7-3.5z" />
                <path d="M3 6.5v7l7 3.5 7-3.5v-7" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#181B22', display: 'block', lineHeight: 1.3 }}>
              Para llevar
            </span>
          </div>

          {/* 5. Transferencia / Datafono */}
          <div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                margin: '0 auto 12px',
                background:
                  'linear-gradient(160deg, rgba(20,40,70,0.28), rgba(65,175,224,0.1))',
                border: '1px solid rgba(65,175,224,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0d3a52"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <rect x="6" y="6" width="12" height="4" rx="1" />
                <line x1="6" y1="13" x2="8" y2="13" />
                <line x1="11" y1="13" x2="13" y2="13" />
                <line x1="16" y1="13" x2="18" y2="13" />
                <line x1="6" y1="17" x2="8" y2="17" />
                <line x1="11" y1="17" x2="13" y2="17" />
                <line x1="16" y1="17" x2="18" y2="17" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#181B22', display: 'block', lineHeight: 1.3 }}>
              Transferencia / Datafono
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

