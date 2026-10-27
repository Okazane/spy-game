import { useState, useEffect, type ReactNode, type CSSProperties } from 'react'

interface TiltedProps {
  children: ReactNode
  deg?: number
  className?: string
  style?: CSSProperties
  onClick?: () => void
}

export function Tilted({ children, deg, className = '', style, onClick }: TiltedProps) {
  const [angle, setAngle] = useState<number>(deg ?? 0)

  useEffect(() => {
    if (deg !== undefined) {
      setAngle(deg)
    } else {
      // Random tilt between -2.5 and +2.5 degrees
      const r = (Math.random() * 4.6 - 2.3)
      setAngle(Number((r > 0 ? r + 0.3 : r - 0.3).toFixed(1)))
    }
  }, [deg])

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
