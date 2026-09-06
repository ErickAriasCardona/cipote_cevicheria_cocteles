import { useState, useRef, useEffect, useMemo, useCallback, Children, isValidElement } from 'react'
import { createPortal } from 'react-dom'
import type { CSSProperties, ReactNode, SelectHTMLAttributes, ChangeEvent, KeyboardEvent } from 'react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  error?: string
  small?: boolean
  options?: SelectOption[]
  containerStyle?: CSSProperties
  labelStyle?: CSSProperties
  placeholder?: string
  onChange?: (event: ChangeEvent<HTMLSelectElement> | { target: { value: string; name?: string; id?: string } }) => void
}

interface MenuCoords {
  top: number
  left: number
  width: number
  placeAbove: boolean
}

function parseOptionsFromChildren(children: ReactNode): SelectOption[] {
  const result: SelectOption[] = []
  Children.forEach(children, (child) => {
    if (isValidElement<{ value?: string | number; children?: ReactNode; label?: string; disabled?: boolean }>(child)) {
      const props = child.props
      const val = props.value !== undefined ? String(props.value) : ''
      let lbl = ''
      if (typeof props.children === 'string' || typeof props.children === 'number') {
        lbl = String(props.children)
      } else if (props.label) {
        lbl = String(props.label)
      } else {
        lbl = val
      }
      result.push({
        value: val,
        label: lbl,
        disabled: Boolean(props.disabled),
      })
    }
  })
  return result
}

export function Select({
  label,
  error,
  small,
  id,
  options,
  children,
  style,
  containerStyle,
  labelStyle,
  placeholder,
  value,
  defaultValue,
  disabled,
  required,
  name,
  onChange,
  ...props
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [internalValue, setInternalValue] = useState<string>(
    value !== undefined ? String(value) : defaultValue !== undefined ? String(defaultValue) : ''
  )
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [coords, setCoords] = useState<MenuCoords | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const nativeSelectRef = useRef<HTMLSelectElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const parsedOptions = useMemo(() => {
    if (options && options.length > 0) {
      return options
    }
    if (children) {
      return parseOptionsFromChildren(children)
    }
    return []
  }, [options, children])

  const currentValue = value !== undefined ? String(value) : internalValue

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const estimatedHeight = Math.min(260, parsedOptions.length * 40 + 16)
    const placeAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow

    setCoords({
      top: placeAbove ? rect.top - 6 : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      placeAbove,
    })
  }, [parsedOptions.length])

  // Actualizar coordenadas y escuchar scroll/resize para mantener anclado el menú
  useEffect(() => {
    if (!isOpen) return

    updateCoords()

    const handleUpdate = () => {
      updateCoords()
    }

    window.addEventListener('scroll', handleUpdate, true)
    window.addEventListener('resize', handleUpdate)
    return () => {
      window.removeEventListener('scroll', handleUpdate, true)
      window.removeEventListener('resize', handleUpdate)
    }
  }, [isOpen, updateCoords])

  // Cerrar al hacer click fuera tanto del botón como del menú portal
  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  // Scroll al elemento seleccionado o destacado cuando se abre
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const targetEl =
        menuRef.current.querySelector('.is-highlighted') ||
        menuRef.current.querySelector('.is-selected')
      if (targetEl) {
        ;(targetEl as HTMLElement).scrollIntoView({ block: 'nearest' })
      }
    }
  }, [isOpen, highlightedIndex])

  const selectedOption = parsedOptions.find((opt) => String(opt.value) === String(currentValue))
  const displayLabel = selectedOption
    ? selectedOption.label
    : (placeholder || (parsedOptions[0]?.label ?? 'Seleccionar...'))

  const handleSelect = (opt: SelectOption) => {
    if (opt.disabled) return
    setInternalValue(opt.value)
    setIsOpen(false)

    if (nativeSelectRef.current) {
      nativeSelectRef.current.value = opt.value
    }

    onChange?.({
      target: {
        value: opt.value,
        name,
        id,
      },
    } as ChangeEvent<HTMLSelectElement>)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setHighlightedIndex(0)
      } else {
        setHighlightedIndex((prev) => (prev < parsedOptions.length - 1 ? prev + 1 : 0))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setHighlightedIndex(parsedOptions.length - 1)
      } else {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : parsedOptions.length - 1))
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < parsedOptions.length) {
        e.preventDefault()
        const opt = parsedOptions[highlightedIndex]
        if (!opt.disabled) {
          handleSelect(opt)
        }
      } else if (!isOpen && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        setIsOpen(true)
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false)
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        marginBottom: 12,
        position: 'relative',
        ...containerStyle,
      }}
    >
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: small ? 12 : 13,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            ...labelStyle,
          }}
        >
          {label}
        </label>
      )}

      {/* Select nativo oculto para accesibilidad y sincronización de formularios */}
      <select
        ref={nativeSelectRef}
        id={id}
        name={name}
        value={currentValue}
        onChange={onChange}
        disabled={disabled}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: 0,
          height: 0,
          margin: 0,
          border: 0,
          padding: 0,
        }}
        {...props}
      >
        {parsedOptions.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Botón visual gatillador del select con diseño glassmorphic */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={id ? `${id}-listbox` : undefined}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`custom-select-trigger ${isOpen ? 'is-open' : ''}`}
        style={{
          borderRadius: small ? 9 : 12,
          padding: small ? '8px 10px' : '12px 14px',
          fontSize: small ? 13 : 14.5,
          minHeight: small ? 34 : 45,
          ...style,
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: selectedOption ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          {displayLabel}
        </span>
        <svg
          width={small ? 14 : 16}
          height={small ? 14 : 16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            color: 'var(--text-secondary)',
            flexShrink: 0,
            marginLeft: 6,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Menú flotante de opciones renderizado vía Portal en document.body para garantizar que salga encima de todo */}
      {isOpen &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            id={id ? `${id}-listbox` : undefined}
            role="listbox"
            className={`custom-select-menu ${coords.placeAbove ? 'is-above' : ''}`}
            style={{
              position: 'fixed',
              top: coords.placeAbove ? 'auto' : `${coords.top}px`,
              bottom: coords.placeAbove ? `${window.innerHeight - coords.top}px` : 'auto',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 99999,
            }}
          >
            {parsedOptions.map((opt, idx) => {
              const isSelected = String(opt.value) === String(currentValue)
              const isHighlighted = idx === highlightedIndex
              const isAction = opt.value === '__nuevo__' || opt.label.startsWith('+')
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`custom-select-option ${isSelected ? 'is-selected' : ''} ${
                    isHighlighted ? 'is-highlighted' : ''
                  } ${isAction ? 'is-action' : ''} ${opt.disabled ? 'is-disabled' : ''}`}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
                    {isAction && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 18,
                          height: 18,
                          borderRadius: 6,
                          background: 'rgba(65, 175, 224, 0.16)',
                          color: 'var(--brand-blue)',
                          fontSize: 13,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        +
                      </span>
                    )}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {isAction && opt.label.startsWith('+') ? opt.label.replace(/^\+\s*/, '') : opt.label}
                    </span>
                  </span>
                  {isSelected && (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ color: 'var(--brand-blue)', flexShrink: 0, marginLeft: 8 }}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>,
          document.body,
        )}

      {error && (
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--red-text)' }}>
          {error}
        </span>
      )}
    </div>
  )
}
