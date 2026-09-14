import type { CSSProperties, SVGProps } from 'react'

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string
  color?: string
  className?: string
  style?: CSSProperties
}

/**
 * Ícono Ceviches y Cócteles:
 * Silueta geométrica tipo copa / copa cóctel con limón y olas marinas,
 * con paleta institucional (#41afe0 azul mar y #e42926 rojo insignia).
 */
export function IconoCeviche({ size = 22, color = 'var(--brand-blue, #41afe0)', style, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      {/* Copa / Bowl de ceviche */}
      <path
        d="M3 7h18c0 4.8-3.2 8.5-7.5 8.9V19h3.5a1 1 0 0 1 0 2h-10a1 1 0 0 1 0-2H11v-3.1C6.7 15.5 3.5 11.8 3 7z"
        fill="rgba(65, 175, 224, 0.16)"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Rodaja de limón / guarnición roja */}
      <path
        d="M14 4a4 4 0 0 1 4 4h-4V4z"
        fill="var(--brand-red, #e42926)"
        stroke="var(--brand-red, #e42926)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Olas de frescura en el interior */}
      <path
        d="M6.5 10.5c1.5 1 3.5 1 5 0s3.5-1 5 0"
        stroke="var(--brand-blue, #41afe0)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Ícono Granizados:
 * Vaso cónico de granizado artesanal con cúpula de nieve y pajilla en tonos rojo y cyan.
 */
export function IconoGranizado({ size = 22, color = 'var(--brand-blue, #41afe0)', style, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      {/* Vaso */}
      <path
        d="M6 10l2 11h8l2-11H6z"
        fill="rgba(65, 175, 224, 0.16)"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Cúpula de nieve frapeada */}
      <path
        d="M6 10c0-3.3 2.7-6 6-6s6 2.7 6 6H6z"
        fill="rgba(228, 41, 38, 0.18)"
        stroke="var(--brand-red, #e42926)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pajilla */}
      <path
        d="M15 2l-3 5"
        stroke="var(--brand-red, #e42926)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Textura de capas de hielo */}
      <line x1="8.5" y1="14" x2="15.5" y2="14" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="9.5" y1="17.5" x2="14.5" y2="17.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Ícono Bebidas:
 * Botella / vaso helado con burbujas y pitillo en colores institucionales.
 */
export function IconoBebida({ size = 22, color = 'var(--brand-blue, #41afe0)', style, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      {/* Tapa */}
      <rect x="4" y="6" width="16" height="2" rx="1" fill={color} />
      {/* Vaso */}
      <path
        d="M6 8l1.6 12.2c.2 1 1 1.8 2 1.8h4.8c1 0 1.8-.8 2-1.8L18 8H6z"
        fill="rgba(65, 175, 224, 0.14)"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pajilla roja inclinada */}
      <path
        d="M14 2l-2.5 4"
        stroke="var(--brand-red, #e42926)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Burbujas de gas / frescura */}
      <circle cx="10" cy="12" r="1.2" fill="var(--brand-blue, #41afe0)" />
      <circle cx="13.5" cy="14.5" r="1" fill="var(--brand-red, #e42926)" />
      <circle cx="11" cy="17" r="1.2" fill="var(--brand-blue, #41afe0)" />
    </svg>
  )
}

/**
 * Ícono Carta / Menú Oficial:
 * Cuaderno o carta con cinta marcapáginas en tonos rojo y azul del sistema.
 */
export function IconoCarta({ size = 22, color = 'var(--brand-red, #e42926)', style, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      {/* Contorno del libro / carta */}
      <path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        fill="rgba(228, 41, 38, 0.12)"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Líneas de texto / platillos */}
      <line x1="8.5" y1="7" x2="16" y2="7" stroke="var(--brand-blue, #41afe0)" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8.5" y1="11" x2="14" y2="11" stroke="var(--brand-blue, #41afe0)" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8.5" y1="15" x2="12" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Ícono Destello / Especiales:
 * Estrella geométrica de 4 puntas en degradado o sólido del sistema.
 */
export function IconoDestello({ size = 18, color = 'var(--brand-blue, #41afe0)', style, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path
        d="M12 2l2.6 6.8L21 11.5l-6.4 2.7L12 21l-2.6-6.8L3 11.5l6.4-2.7L12 2z"
        fill="rgba(65, 175, 224, 0.22)"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Ícono Check / Verificado:
 * Marca de verificación en forma vectorial precisa con color verde institucional.
 */
export function IconoCheck({ size = 16, color = 'currentColor', strokeWidth = 2.4, style, ...props }: IconProps & { strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

/**
 * Ícono Cruz / Cerrar / Eliminar:
 * X geométrica simétrica.
 */
export function IconoCruz({ size = 16, color = 'currentColor', strokeWidth = 2.2, style, ...props }: IconProps & { strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

/**
 * Ícono Plus (+):
 * Cruz de suma geométrica limpia.
 */
export function IconoPlus({ size = 16, color = 'currentColor', strokeWidth = 2.4, style, ...props }: IconProps & { strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

/**
 * Ícono Minus (-):
 * Línea de resta geométrica limpia.
 */
export function IconoMinus({ size = 16, color = 'currentColor', strokeWidth = 2.4, style, ...props }: IconProps & { strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

/**
 * Ícono Flecha Derecha (->)
 */
export function IconoFlechaDerecha({ size = 16, color = 'currentColor', strokeWidth = 2.2, style, ...props }: IconProps & { strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

/**
 * Ícono Papelera / Eliminar
 */
export function IconoTrash({ size = 14, color = 'currentColor', strokeWidth = 2, style, ...props }: IconProps & { strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

/**
 * Ícono WhatsApp
 */
export function IconoWhatsApp({ size = 18, color = 'currentColor', style, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...props}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}
