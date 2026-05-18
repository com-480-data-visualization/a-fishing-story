import type { Zone } from '../data/zones'
import { theme } from '../theme'

interface ZoneInfoPanelProps {
  zone: Zone
  onClose: () => void
}

export default function ZoneInfoPanel({ zone, onClose }: ZoneInfoPanelProps) {
  const paragraphs = zone.description.split('\n\n')

  return (
    <div style={{
      position: 'absolute',
      left: 24,
      bottom: 70,
      width: 370,
      padding: '16px 20px',
      background: theme.panelBg,
      border: `1px solid ${zone.color}66`,
      borderRadius: 16,
      backdropFilter: 'blur(10px)',
      boxShadow: theme.shadowPanel,
      color: theme.textPrimary,
      zIndex: 15,
      animation: 'zoneFadeUp 0.3s ease both',
      pointerEvents: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 9, height: 9, borderRadius: '50%',
            background: zone.color,
            boxShadow: `0 0 8px ${zone.color}88`,
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>{zone.name}</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: theme.textMuted,
            cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px',
            flexShrink: 0, marginLeft: 8,
          }}
        >
          ×
        </button>
      </div>
      <div style={{
        fontSize: 13, lineHeight: 1.7, color: theme.textSecondary,
        maxHeight: 260, overflowY: 'auto',
        paddingRight: 4,
      }}>
        {paragraphs.map((para, i) => (
          <p key={i} style={{ margin: 0, marginBottom: i < paragraphs.length - 1 ? 10 : 0 }}>
            {para}
          </p>
        ))}
      </div>
    </div>
  )
}
