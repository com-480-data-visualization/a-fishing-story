import { useState } from 'react'

export type TimeSeriesPoint = {
  year: number
  month: number
  vessel_count: number
}

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const MONTH_FULL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const SVG_W = 380
const SVG_H = 215
const PAD = { left: 36, right: 10, top: 58, bottom: 22 }
const PLOT_W = SVG_W - PAD.left - PAD.right
const PLOT_H = SVG_H - PAD.top - PAD.bottom

function heatColor(t: number): string {
  return `rgb(${Math.round(10 - t * 10)}, ${Math.round(30 + t * 170)}, ${Math.round(80 + t * 120)})`
}

function fmtCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n))
}

export default function HeatmapChart({ data }: { data: TimeSeriesPoint[] }) {
  const [hoveredCell, setHoveredCell] = useState<{ year: number; month: number } | null>(null)

  if (!data.length) return null

  const years = [...new Set(data.map(d => d.year))].sort((a, b) => a - b)
  const cellW = PLOT_W / 12
  const cellH = PLOT_H / (years.length || 1)

  const lookup = new Map(data.map(d => [`${d.year}-${d.month}`, d.vessel_count]))
  const counts = data.map(d => d.vessel_count)
  const maxCount = Math.max(...counts, 1)
  const minCount = Math.min(...counts, 0)

  const hov = hoveredCell
  const hovCount = hov ? (lookup.get(`${hov.year}-${hov.month}`) ?? 0) : 0

  return (
    <div style={{
      width: SVG_W + 40,
      background: 'rgba(10, 14, 18, 0.52)',
      border: '1px solid rgba(255,255,255,0.14)',
      borderRadius: 18,
      backdropFilter: 'blur(8px)',
      padding: '16px 20px',
      pointerEvents: 'auto',
    }}>
      <svg width={SVG_W} height={SVG_H}>
        <text x={SVG_W / 2} y={20} textAnchor="middle" fill="white" style={{ fontSize: 16, fontWeight: 700 }}>
          Fishing Activity Over Time
        </text>
        <text x={SVG_W / 2} y={36} textAnchor="middle" fill="rgba(255,255,255,0.5)" style={{ fontSize: 10 }}>
          monthly vessel presence · visible area
        </text>

        {/* Color-scale legend — scale is relative to the visible cells */}
        <defs>
          <linearGradient id="heat-legend" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={heatColor(0)} />
            <stop offset="50%" stopColor={heatColor(0.5)} />
            <stop offset="100%" stopColor={heatColor(1)} />
          </linearGradient>
        </defs>
        <rect x={SVG_W - 96} y={9} width={56} height={6} rx={2} fill="url(#heat-legend)" />
        <text x={SVG_W - 99} y={15} textAnchor="end" dominantBaseline="middle"
          fill="rgba(255,255,255,0.45)" style={{ fontSize: 8 }}>
          {fmtCount(minCount)}
        </text>
        <text x={SVG_W - 37} y={15} dominantBaseline="middle"
          fill="rgba(255,255,255,0.45)" style={{ fontSize: 8 }}>
          {fmtCount(maxCount)}
        </text>

        {MONTH_LABELS.map((m, i) => (
          <text key={i} x={PAD.left + i * cellW + cellW / 2} y={PAD.top - 6}
            textAnchor="middle" fill="rgba(255,255,255,0.45)" style={{ fontSize: 9 }}>
            {m}
          </text>
        ))}

        {years.map((yr, i) => (
          <text key={yr} x={PAD.left - 5} y={PAD.top + i * cellH + cellH / 2}
            textAnchor="end" dominantBaseline="middle"
            fill="rgba(255,255,255,0.6)" style={{ fontSize: 9, fontWeight: 600 }}>
            {yr}
          </text>
        ))}

        {years.map((yr, yi) =>
          MONTHS.map((mo, mi) => {
            const count = lookup.get(`${yr}-${mo}`) ?? 0
            const t = (count - minCount) / (maxCount - minCount)
            const isHov = hov?.year === yr && hov?.month === mo
            return (
              <rect key={`${yr}-${mo}`}
                x={PAD.left + mi * cellW + 1.5} y={PAD.top + yi * cellH + 1.5}
                width={cellW - 3} height={cellH - 3} rx={3}
                fill={count > 0 ? heatColor(t) : 'rgba(255,255,255,0.04)'}
                stroke={isHov ? 'rgba(255,255,255,0.9)' : 'none'}
                strokeWidth={2}
                style={{ cursor: 'pointer', filter: isHov ? 'brightness(1.5)' : 'none', transition: 'filter 0.15s ease' }}
                onMouseEnter={() => setHoveredCell({ year: yr, month: mo })}
                onMouseLeave={() => setHoveredCell(null)}
              />
            )
          })
        )}

        {hov && (
          <g>
            <rect x={SVG_W / 2 - 105} y={SVG_H - PAD.bottom + 3} width={210} height={16} rx={4}
              fill="rgba(0,0,0,0.65)" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
            <text x={SVG_W / 2} y={SVG_H - PAD.bottom + 12} textAnchor="middle"
              dominantBaseline="middle" fill="rgba(255,255,255,0.88)" style={{ fontSize: 10 }}>
              {MONTH_FULL[hov.month - 1]} {hov.year} · {hovCount >= 1000 ? `${(hovCount / 1000).toFixed(1)}k` : hovCount} vessels
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
