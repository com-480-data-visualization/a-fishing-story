// Reproduces fishingColor() from utils.ts
// t=0   → rgb(0,   0,   180)  dark blue
// t=0.5 → rgb(127, 100,  90)  brown
// t=1   → rgb(255, 200,   0)  yellow

const GRADIENT_CSS = `linear-gradient(to top,
  rgb(0,   0,   180),
  rgb(64,  50,  135),
  rgb(127, 100,  90),
  rgb(191, 150,  45),
  rgb(255, 200,   0)
)`

function fmt(v: number): string {
  if (v === 0) return '0'
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
  return String(Math.round(v))
}

import { useState } from 'react'
import { theme } from '../theme'
import { FLAG_COLORS } from '../utils'
import { getCountryName } from '../data/countryNames'

interface MapLegendProps {
  maxHours: number
  selectedFlags: string[]
}

const FISHING_HOURS_INFO =
  'Fishing hours estimate the time vessels spent actively fishing, inferred ' +
  'from AIS vessel-tracking data by Global Fishing Watch. Within each map grid ' +
  'cell, the hours of every vessel are summed, so a single cell can exceed 24 ' +
  'hours in a day.'

const BAR_H = 110

// Inverse of log1p scale: given position t in [0,1], return the fishing_hours value
function logToValue(t: number, max: number): number {
  return Math.round(Math.expm1(t * Math.log1p(max)))
}

const CONTAINER_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 20,
  left: 20,
  zIndex: 20,
  background: theme.surfaceBg,
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: `1px solid ${theme.border}`,
  boxShadow: theme.shadowSoft,
  borderRadius: 14,
  padding: '12px 14px 12px 12px',
  userSelect: 'none',
  minWidth: 110,
}

const TITLE_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: theme.textPrimary,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

export default function MapLegend({ maxHours, selectedFlags }: MapLegendProps) {
  const [infoOpen, setInfoOpen] = useState(false)

  // Flag-filter mode: each flag is rendered with its own solid hue, darkened
  // by fishing intensity. All flags share one brightness scale, so a single
  // pair of end labels applies to every flag's ramp.
  if (selectedFlags.length > 0) {
    return (
      <div style={{ ...CONTAINER_STYLE, maxWidth: 200 }}>
        <div style={{ ...TITLE_STYLE, marginBottom: 8 }}>Fishing Hours by Flag</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {selectedFlags.map((code, i) => {
            const [r, g, b] = FLAG_COLORS[i % FLAG_COLORS.length]
            return (
              <div key={code}>
                <div style={{ fontSize: 11, color: theme.textPrimary, marginBottom: 3 }}>
                  {getCountryName(code)}
                </div>
                <div style={{
                  height: 8, borderRadius: 4,
                  background: `linear-gradient(to right, rgb(0,0,0), rgb(${r}, ${g}, ${b}))`,
                  border: `1px solid ${theme.border}`,
                }} />
              </div>
            )
          })}
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 9, color: theme.textMuted, marginTop: 5,
          fontVariantNumeric: 'tabular-nums',
        }}>
          <span>0</span>
          <span>{fmt(maxHours)} h</span>
        </div>
        <div style={{
          fontSize: 9,
          color: theme.textMuted,
          letterSpacing: '0.04em',
          lineHeight: 1.5,
          marginTop: 7,
        }}>
          {/* Brightness scales with fishing hours per grid cell — a shared scale
          across all selected flags. */}
        </div>
      </div>
    )
  }

  const ticks = [
    { label: fmt(maxHours),                    pct: 100, highlight: 'rgb(255,200,0)'  },
    { label: fmt(logToValue(0.75, maxHours)),   pct: 75,  highlight: null              },
    { label: fmt(logToValue(0.50, maxHours)),   pct: 50,  highlight: null              },
    { label: fmt(logToValue(0.25, maxHours)),   pct: 25,  highlight: null              },
    { label: '0',                              pct: 0,   highlight: 'rgb(100,130,220)' },
  ]

  return (
    <div style={{ ...CONTAINER_STYLE, pointerEvents: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        marginBottom: 3,
      }}>
        <span style={TITLE_STYLE}>
          Fishing Hours
        </span>
        <button
          onClick={() => setInfoOpen(o => !o)}
          title="About fishing hours"
          style={{
            width: 16, height: 16, borderRadius: '50%',
            border: `1px solid ${infoOpen ? theme.accentBorder : theme.border}`,
            background: infoOpen ? theme.accentBg : 'transparent',
            color: infoOpen ? theme.accent : theme.textMuted,
            cursor: 'pointer', padding: 0,
            fontSize: 10, fontWeight: 700, fontStyle: 'italic',
            fontFamily: 'Georgia, serif', lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'auto',
          }}
        >
          i
        </button>
      </div>

      {infoOpen && (
        <div style={{
          position: 'absolute', top: 10, left: 'calc(100% + 8px)',
          width: 210,
          background: theme.panelBg,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          boxShadow: theme.shadowPanel,
          padding: '10px 12px',
          fontSize: 11, lineHeight: 1.55, color: theme.textSecondary,
          pointerEvents: 'auto',
          textTransform: 'none', letterSpacing: 'normal', fontWeight: 400,
        }}>
          {FISHING_HOURS_INFO}
        </div>
      )}
      <div style={{
        fontSize: 9,
        color: theme.textMuted,
        letterSpacing: '0.04em',
        marginBottom: 10,
      }}>
        per grid cell · visible area
      </div>

      <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
        <div style={{
          width: 12,
          height: BAR_H,
          borderRadius: 6,
          background: GRADIENT_CSS,
          flexShrink: 0,
          boxShadow: '0 0 12px rgba(255,200,0,0.12)',
        }} />

        <div style={{ position: 'relative', height: BAR_H, flex: 1 }}>
          {ticks.map(({ label, pct, highlight }) => (
            <div
              key={pct}
              style={{
                position: 'absolute',
                bottom: `${pct}%`,
                transform: 'translateY(50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              <div style={{ width: 5, height: 1, background: theme.borderStrong }} />
              <span style={{
                fontSize: 9,
                color: highlight ?? theme.textMuted,
                fontWeight: highlight ? 600 : 400,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
