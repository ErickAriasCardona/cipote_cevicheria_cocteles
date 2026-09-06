import { useEffect } from 'react'
import { CarritoProvider } from '../../hooks/useCarrito'
import { LandingNav } from '../../components/landing/LandingNav'
import { LandingHero } from '../../components/landing/LandingHero'
import { LandingMenu } from '../../components/landing/LandingMenu'
import { LandingFeatured } from '../../components/landing/LandingFeatured'
import { LandingServices } from '../../components/landing/LandingServices'
import { LandingFooter } from '../../components/landing/LandingFooter'
import { CartDrawer } from '../../components/landing/CartDrawer'
import { FloatingCartButton } from '../../components/landing/FloatingCartButton'

export function LandingPage() {
  useEffect(() => {
    const root = document.getElementById('landing-root')
    if (!root) return

    const tiltCleanups: (() => void)[] = []
    root.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        el.style.transform = `perspective(900px) rotateX(${(-y * 10).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg) translateY(-4px)`
      }
      const onLeave = () => {
        el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)'
      }
      el.addEventListener('mousemove', onMove)
      el.addEventListener('mouseleave', onLeave)
      tiltCleanups.push(() => {
        el.removeEventListener('mousemove', onMove)
        el.removeEventListener('mouseleave', onLeave)
      })
    })

    return () => {
      tiltCleanups.forEach((fn) => fn())
    }
  }, [])

  return (
    <CarritoProvider>
      <div
        id="landing-root"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          color: '#181B22',
          overflowX: 'hidden',
          position: 'relative',
          background: 'linear-gradient(160deg, #fbfbfc 0%, #f3f5f7 45%, #f8f2f3 100%)',
          minHeight: '100vh',
        }}
      >
        {/* Orbes de ambiente animados de Claude Design */}
        <div
          style={{
            position: 'fixed',
            top: -140,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: '#E42926',
            opacity: 0.12,
            filter: 'blur(120px)',
            pointerEvents: 'none',
            zIndex: 0,
            animation: 'drift1 16s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'fixed',
            top: '40vh',
            left: -140,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: '#41AFE0',
            opacity: 0.14,
            filter: 'blur(120px)',
            pointerEvents: 'none',
            zIndex: 0,
            animation: 'drift2 20s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'fixed',
            bottom: -160,
            right: '10vw',
            width: 460,
            height: 460,
            borderRadius: '50%',
            background: '#E42926',
            opacity: 0.08,
            filter: 'blur(130px)',
            pointerEvents: 'none',
            zIndex: 0,
            animation: 'drift3 18s ease-in-out infinite',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <LandingNav />
          <main>
            <LandingHero />
            <LandingMenu />
            <LandingFeatured />
            <LandingServices />
          </main>
          {/* Footer exacto aprobado por el usuario */}
          <LandingFooter />
          <CartDrawer />
          <FloatingCartButton />
        </div>
      </div>
    </CarritoProvider>
  )
}

