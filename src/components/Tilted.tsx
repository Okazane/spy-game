import { useState, type ReactNode, type CSSProperties } from 'react'

interface TiltedProps {
  children: ReactNode
  deg?: number
  className?: string
  style?: CSSProperties
  onClick?: () => void
}

export function Tilted({ children, deg, className = '', style, onClick }: TiltedProps) {
  const [fallbackAngle] = useState<number>(() => {
    const r = Math.random() * 4.6 - 2.3
    return Number((r > 0 ? r + 0.3 : r - 0.3).toFixed(1))
  })
  const angle = deg ?? fallbackAngle

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        ...style,
        transform: `rotate(${angle}deg)`,
        transition: 'transform 0.2s cubic-bezier(0.25, 1.5, 0.5, 1)',
      }}
    >
      {children}
    </div>
  )
}
