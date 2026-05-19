import { useState } from 'react'
import type { ReactNode } from 'react'
import { theme } from '../../theme'

interface ChartFrameProps {
  title: string
  subtitle?: string
  /** Longer explanation shown in a popover when the info icon is clicked. */
  info?: string
  /** When true, the chart area is replaced by an empty-state message. */
  empty: boolean
  /** Height reserved for the chart / empty-state area so the panel layout
   *  stays stable whether or not data is present. */
  bodyHeight: number
  children: ReactNode
}

/**
 * Shared chrome for a panel chart: centered title + subtitle, an optional info
 * popover, then either the chart body or an empty state. Deliberately has no
 * card background or border — charts are separated by dividers in ChartPanel.
 */
export default function ChartFrame({ title, subtitle, info, empty, bodyHeight, children }: ChartFrameProps) {
  const [infoOpen, setInfoOpen] = useState(false)

  return (
    <div style={{ width: '100%', padding: '0 22px', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.textPrimary }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 3 }}>
              {subtitle}
            </div>
          )}
        </div>

        {info && (
          <button
            onClick={() => setInfoOpen(o => !o)}
            title="About this chart"
            style={{
              position: 'absolute', top: 0, right: 0,
              width: 18, height: 18, borderRadius: '50%',
              border: `1px solid ${infoOpen ? theme.accentBorder : theme.border}`,
              background: infoOpen ? theme.accentBg : 'transparent',
              color: infoOpen ? theme.accent : theme.textMuted,
              cursor: 'pointer', padding: 0,
              fontSize: 11, fontWeight: 700, fontStyle: 'italic',
              fontFamily: 'Georgia, serif', lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            i
          </button>
        )}
      </div>

      {info && infoOpen && (
        <div style={{
          position: 'absolute', top: 26, right: 22, left: 22, zIndex: 5,
          background: theme.panelBg,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          boxShadow: theme.shadowPanel,
          padding: '10px 12px',
          fontSize: 11, lineHeight: 1.55, color: theme.textSecondary,
        }}>
          {info}
        </div>
      )}

      {/* Body height is fixed so the chart keeps the same footprint regardless
          of how many rows of data are present. */}
      {empty ? (
        <div style={{
          height: bodyHeight,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: theme.textFaint, fontSize: 12,
        }}>
          No data in this area
        </div>
      ) : (
        <div style={{ height: bodyHeight }}>
          {children}
        </div>
      )}
    </div>
  )
}
