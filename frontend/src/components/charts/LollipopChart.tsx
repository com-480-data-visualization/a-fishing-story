import { useState } from 'react'

export type IllegalItem = {
  label: string
  illegal_count: number
  total_count: number
  value: number
}

const SVG_W = 320
const SVG_H = 220
const PAD = { left: 54, right: 20, top: 44, bottom: 14 }
const TRACK_W = SVG_W - PAD.left - PAD.right
const ROW_H = (SVG_H - PAD.top - PAD.bottom) / 5

function lollipopColor(value: number): string {
  const t = Math.min(1, value / 100)
  return `rgb(${Math.round(241 + t * (231 - 241))}, ${Math.round(196 + t * (76 - 196))}, ${Math.round(15 + t * (60 - 15))})`
}

export default function LollipopChart({ data }: { data: IllegalItem[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data.length) return null

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
          Illegal Fishing
        </text>
        <text x={SVG_W / 2} y={36} textAnchor="middle" fill="rgba(255,255,255,0.5)" style={{ fontSize: 10 }}>
          % of vessels in foreign EEZ · top 5 countries
        </text>

        {data.map((item, i) => {
          const y = PAD.top + i * ROW_H + ROW_H / 2
          const lineX = PAD.left + (item.value / 100) * TRACK_W
          const isHov = hoveredIndex === i
          const color = lollipopColor(item.value)
          const r = isHov ? 10 : 7

          return (
            <g key={item.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}>
              <text x={PAD.left - 8} y={y} textAnchor="end" dominantBaseline="middle"
                fill="rgba(255,255,255,0.85)"
                style={{ fontSize: 11, fontWeight: isHov ? 700 : 400 }}>
                {item.label}
              </text>
              <line x1={PAD.left} x2={PAD.left + TRACK_W} y1={y} y2={y}
                stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
              <line x1={PAD.left} x2={lineX - r + 2} y1={y} y2={y}
                stroke={color} strokeWidth={isHov ? 2.5 : 1.8} opacity={isHov ? 1 : 0.8}
                style={{ transition: 'all 0.2s ease' }} />
              <circle cx={lineX} cy={y} r={r}
                fill={color} stroke="rgba(255,255,255,0.85)" strokeWidth={isHov ? 2 : 1.5}
                opacity={isHov ? 1 : 0.88}
                style={{ transition: 'all 0.2s ease' }} />
              <text x={lineX} y={y} textAnchor="middle" dominantBaseline="middle"
                fill="white" style={{ fontSize: isHov ? 8 : 7, fontWeight: 700, pointerEvents: 'none' }}>
                {Math.round(item.value)}
              </text>
              {isHov && (
                <text x={lineX + r + 6} y={y} dominantBaseline="middle"
                  fill="rgba(255,255,255,0.6)" style={{ fontSize: 9 }}>
                  {item.illegal_count} / {item.total_count}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
