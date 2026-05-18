import { useState } from 'react'
import { getCountryName } from '../../data/countryNames'
import { theme } from '../../theme'
import ChartFrame from './ChartFrame'

export type IllegalItem = {
  label: string
  illegal_count: number
  total_count: number
  value: number
}

const ROW_H = 16
const ROW_GAP = 9
const LEGEND_H = 16
const BODY_HEIGHT = LEGEND_H + 5 * ROW_H + 5 * ROW_GAP

const FOREIGN_COLOR = '#e0533b'
const HOME_COLOR = 'rgba(15,23,42,0.16)'

function fmtHours(h: number): string {
  return h >= 1000 ? `${(h / 1000).toFixed(1)}k` : String(Math.round(h))
}

function LegendKey({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 9, height: 9, borderRadius: 2, background: color }} />
      <span style={{ fontSize: 9, color: theme.textMuted }}>{label}</span>
    </div>
  )
}

/**
 * Segmented bar chart of fishing in foreign EEZs. Each bar's length encodes a
 * country's total fishing effort (relative to the busiest country); the
 * highlighted segment is the share fished inside another country's EEZ. Showing
 * the total bar avoids the lollipop's trap where a flag with a few hours all in
 * foreign waters reads as a maxed-out "100%".
 */
export default function IllegalFishingChart({ data }: { data: IllegalItem[] }) {
  const [hovered, setHovered] = useState<string | null>(null)

  // data arrives sorted by foreign-EEZ hours descending.
  const maxTotal = Math.max(...data.map(d => d.total_count), 1)

  return (
    <ChartFrame
      title="Foreign EEZ Fishing"
      subtitle="daily fishing effort in foreign EEZ · top 5 countries"
      info="For each country, the bar shows its total fishing effort for the selected day in the visible area. The red segment is the share carried out inside another country's Exclusive Economic Zone (EEZ). Fishing in a foreign EEZ may still be authorised under access agreements."
      empty={!data.length}
      bodyHeight={BODY_HEIGHT}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: ROW_GAP }}>
        <div style={{
          display: 'flex', gap: 14, justifyContent: 'center',
          height: LEGEND_H, alignItems: 'center',
        }}>
          <LegendKey color={FOREIGN_COLOR} label="foreign EEZ" />
          <LegendKey color={HOME_COLOR} label="home waters" />
        </div>

        {data.map(d => {
          const name = getCountryName(d.label)
          const isHov = hovered === d.label
          const totalPct = (d.total_count / maxTotal) * 100
          const foreignFrac = d.total_count > 0 ? d.illegal_count / d.total_count : 0
          return (
            <div
              key={d.label}
              onMouseEnter={() => setHovered(d.label)}
              onMouseLeave={() => setHovered(null)}
              title={`${name}: ${fmtHours(d.illegal_count)}h in foreign EEZ of ${fmtHours(d.total_count)}h total`}
              style={{ display: 'flex', alignItems: 'center', gap: 8, height: ROW_H }}
            >
              <div style={{
                width: 104, flexShrink: 0,
                fontSize: 11, textAlign: 'right',
                color: isHov ? theme.textPrimary : theme.textSecondary,
                fontWeight: isHov ? 600 : 400,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {name}
              </div>
              <div style={{
                flex: 1, height: 13, borderRadius: 3,
                background: theme.gridLine, position: 'relative',
              }}>
                <div style={{
                  width: `${totalPct}%`, minWidth: 3, height: '100%',
                  borderRadius: 3, overflow: 'hidden', display: 'flex',
                  opacity: isHov ? 1 : 0.9, transition: 'opacity 0.15s ease',
                }}>
                  <div style={{ width: `${foreignFrac * 100}%`, background: FOREIGN_COLOR }} />
                  <div style={{ flex: 1, background: HOME_COLOR }} />
                </div>
              </div>
              <div style={{
                width: 44, flexShrink: 0,
                fontSize: 11, fontWeight: 600,
                color: FOREIGN_COLOR,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {d.value.toFixed(0)}%
              </div>
            </div>
          )
        })}
      </div>
    </ChartFrame>
  )
}
