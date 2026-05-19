import type { ReactNode } from 'react'
import { theme } from '../theme'

interface MapControlsProps {
  panelOpen: boolean
  onTogglePanel: () => void
  flagActive: boolean
  flagPickerOpen: boolean
  onToggleFlagPicker: () => void
  showEEZ: boolean
  onToggleEEZ: () => void
}

function ControlButton({ active, title, onClick, children }: {
  active: boolean
  title: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 44, height: 44,
        background: active ? theme.accentBg : theme.surfaceBg,
        color: active ? theme.accent : theme.textPrimary,
        border: `1px solid ${active ? theme.accentBorder : theme.border}`,
        borderRadius: 8,
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: theme.shadowSoft,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}

/**
 * Horizontal row of map controls anchored to the top-right of the map area.
 * Because the map area is a flex child that shrinks when the chart panel
 * opens, the row tracks the panel edge automatically — no manual offset.
 */
export default function MapControls({
  panelOpen, onTogglePanel,
  flagActive, flagPickerOpen, onToggleFlagPicker,
  showEEZ, onToggleEEZ,
}: MapControlsProps) {
  return (
    <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 8, zIndex: 20 }}>
      {/* Country filter */}
      <ControlButton
        active={flagActive || flagPickerOpen}
        title={flagActive ? 'Country filter active' : 'Filter by country'}
        onClick={onToggleFlagPicker}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <rect x="3" y="1" width="1.5" height="16" rx="0.75" />
          <rect x="4.5" y="1.5" width="10" height="7" rx="1" opacity={flagActive ? 1 : 0.75} />
        </svg>
      </ControlButton>

      {/* EEZ boundaries */}
      <ControlButton
        active={showEEZ}
        title={showEEZ ? 'Hide EEZ boundaries' : 'Show EEZ boundaries'}
        onClick={onToggleEEZ}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="9" cy="9" r="7" />
          <path d="M2 9h14M9 2c-2 2-3 4-3 7s1 5 3 7M9 2c2 2 3 4 3 7s-1 5-3 7" />
        </svg>
      </ControlButton>

      {/* Chart panel */}
      <ControlButton
        active={panelOpen}
        title={panelOpen ? 'Hide charts' : 'Show charts'}
        onClick={onTogglePanel}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <rect x="1"  y="10" width="4" height="7"  rx="1" opacity={panelOpen ? 1 : 0.5} />
          <rect x="7"  y="5"  width="4" height="12" rx="1" opacity={panelOpen ? 1 : 0.5} />
          <rect x="13" y="1"  width="4" height="16" rx="1" opacity={panelOpen ? 1 : 0.5} />
        </svg>
      </ControlButton>
    </div>
  )
}
