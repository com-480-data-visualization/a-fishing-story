import { useState } from 'react'
import { getCountryName } from '../../data/countryNames'
import { theme } from '../../theme'
import ChartFrame from './ChartFrame'

export type BarItem = {
  label: string
  value: number
}

const OTHER_LABEL = 'Other'
const MAX_ROWS = 7
const ROW_H = 16
const ROW_GAP = 7
// Worst case is MAX_ROWS countries plus the aggregated "Other" bar.
const MAX_BARS = MAX_ROWS + 1
const BODY_HEIGHT = MAX_BARS * ROW_H + (MAX_BARS - 1) * ROW_GAP

/**
 * Sorted horizontal bar chart of fishing effort share by country. The long tail
 * past MAX_ROWS countries is aggregated into a single "Other" bar so the bars
 * still read as a part-to-whole.
 */
export default function BarChart({ data }: { data: BarItem[] }) {
  const [hovered, setHovered] = useState<string | null>(null)

  // data arrives already sorted by value descending.
  const top = data.slice(0, MAX_ROWS)
  const restSum = data.slice(MAX_ROWS).reduce((sum, d) => sum + d.value, 0)
  const display = restSum > 0.05
    ? [...top, { label: OTHER_LABEL, value: restSum }]
    : top

  return (
    <ChartFrame
      title="Fishing Effort by Country"
      subtitle="daily share of fishing hours · visible area"
      info="Share of total fishing hours by vessel flag state, for the selected day and the area currently visible on the map. Countries beyond the top 7 are grouped into a single 'Other' bar."
      empty={!data.length}
      bodyHeight={BODY_HEIGHT}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: ROW_GAP }}>
        {display.map(d => {
          const isOther = d.label === OTHER_LABEL
          const name = isOther ? 'Other' : getCountryName(d.label)
          const isHov = hovered === d.label
          return (
            <div
              key={d.label}
              onMouseEnter={() => setHovered(d.label)}
              onMouseLeave={() => setHovered(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, height: ROW_H }}
            >
              <div
                title={name}
                style={{
                  width: 104, flexShrink: 0,
                  fontSize: 11, textAlign: 'right',
                  color: isHov ? theme.textPrimary : theme.textSecondary,
                  fontWeight: isHov ? 600 : 400,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                {name}
              </div>
              <div style={{
                flex: 1, height: 13, borderRadius: 3,
                background: theme.gridLine, position: 'relative',
              }}>
                <div style={{
                  width: `${Math.min(d.value, 100)}%`, minWidth: 2, height: '100%',
                  borderRadius: 3,
                  background: isOther ? theme.textMuted : theme.accent,
                  opacity: isHov ? 1 : 0.85,
                  transition: 'opacity 0.15s ease',
                }} />
              </div>
              <div style={{
                width: 44, flexShrink: 0,
                fontSize: 11, fontWeight: 600,
                color: theme.textPrimary,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {d.value.toFixed(1)}%
              </div>
            </div>
          )
        })}
      </div>
    </ChartFrame>
  )
}
