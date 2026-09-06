import { useCarrito } from '../../hooks/useCarrito'

export function FloatingCartButton() {
  const { totalCount, toggleDrawer } = useCarrito()

  return (
    <button
      type="button"
      onClick={toggleDrawer}
      aria-label={`Ver pedido (${totalCount} productos)`}
      style={{
        position: 'fixed',
        bottom: 26,
        right: 26,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'linear-gradient(160deg, #f1544f, #E42926 45%, #c81e1e)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 16px 34px rgba(228, 41, 38, 0.4)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        transition: 'transform 0.15s ease',
      }}
    >
      <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="1.6">
        <path
          d="M2 3h2l1.2 9.6a1.6 1.6 0 0 0 1.6 1.4h7.6a1.6 1.6 0 0 0 1.58-1.36L17 6H5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="17" r="1.1" fill="#fff" stroke="none" />
        <circle cx="14.5" cy="17" r="1.1" fill="#fff" stroke="none" />
      </svg>
      {totalCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            background: '#41AFE0',
            color: '#fff',
            fontSize: 11,
            fontWeight: 800,
            minWidth: 20,
            height: 20,
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
          }}
        >
          {totalCount}
        </span>
      )}
    </button>
  )
}

