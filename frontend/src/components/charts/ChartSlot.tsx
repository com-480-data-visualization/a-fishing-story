import { useState } from 'react'
import type { ReactNode } from 'react'

export const COMPACT_SCALE = 0.82
const COMPACT_OPACITY = 0.55

interface ChartSlotProps {
  children: ReactNode
  naturalHeight: number
  expandOffset?: number
  locked?: boolean
  onToggleLock?: () => void
}

export default function ChartSlot({
  children,
  naturalHeight,
  expandOffset = 0,
  locked = false,
  onToggleLock,
}: ChartSlotProps) {
  const [hovered, setHovered] = useState(false)
  const expanded = locked || hovered

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onToggleLock}
      style={{
        height: naturalHeight * COMPACT_SCALE,
        overflow: 'visible',
        flexShrink: 0,
        position: 'relative',
        zIndex: expanded ? 25 : 1,
        cursor: 'pointer',
      }}
    >
      <div style={{
        transform: expanded
          ? `translateY(${expandOffset}px) scale(1)`
          : `translateY(0px) scale(${COMPACT_SCALE})`,
        transformOrigin: 'top right',
        opacity: expanded ? 1 : COMPACT_OPACITY,
        transition: 'transform 0.25s ease, opacity 0.2s ease, box-shadow 0.2s ease',
        borderRadius: 18,
        boxShadow: locked ? '0 0 0 2px rgba(255,255,255,0.55), 0 0 18px rgba(255,255,255,0.08)' : 'none',
      }}>
        {children}
      </div>
    </div>
  )
}
