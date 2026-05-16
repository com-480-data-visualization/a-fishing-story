import { useState } from 'react'

export type BubbleItem = {
  label: string
  value: number
  color: string
}

const PALETTE = [
  '#2E86DE', '#FF7F0E', '#2CA02C', '#D62728', '#9467BD',
  '#8C564B', '#E377C2', '#7F7F7F', '#BCBD22', '#17BECF',
]

const OTHER_COLOR = 'rgba(150,160,170,0.9)'

export function getBubbleColor(index: number): string {
  return PALETTE[index % PALETTE.length]
}

const SVG_W = 340
const SVG_H = 250
const PLOT_CX = SVG_W / 2
const PLOT_CY = 44 + (SVG_H - 44) / 2
const MIN_R = 16
const MAX_R = 58

function packBubbles(items: (BubbleItem & { r: number })[]) {
  const n = items.length
  const nodes = items.map((item, i) => ({
    ...item,
    x: PLOT_CX + Math.cos((2 * Math.PI * i) / n - Math.PI / 2) * 95,
    y: PLOT_CY + Math.sin((2 * Math.PI * i) / n - Math.PI / 2) * 82,
  }))

  for (let iter = 0; iter < 320; iter++) {
    for (const node of nodes) {
      node.x += (PLOT_CX - node.x) * 0.028
      node.y += (PLOT_CY - node.y) * 0.028
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x
        const dy = nodes[j].y - nodes[i].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const minDist = nodes[i].r + nodes[j].r + 4
        if (dist < minDist && dist > 0.001) {
          const f = ((minDist - dist) / dist) * 0.5
          nodes[i].x -= dx * f; nodes[i].y -= dy * f
          nodes[j].x += dx * f; nodes[j].y += dy * f
        }
      }
    }
    for (const node of nodes) {
      node.x = Math.max(node.r + 8, Math.min(SVG_W - node.r - 8, node.x))
      node.y = Math.max(44 + node.r + 6, Math.min(SVG_H - node.r - 8, node.y))
    }
  }
  return nodes
}

export default function BubbleChart({ data }: { data: BubbleItem[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data.length) return null

  // Show the top 9 countries; aggregate the long tail into a single "Other" bubble
  // so the bubbles still read as a part-to-whole of the visible area.
  const top = data.slice(0, 9)
  const restSum = data.slice(9).reduce((sum, d) => sum + d.value, 0)
  const display = restSum > 0.05
    ? [...top, { label: 'Other', value: restSum, color: OTHER_COLOR }]
    : top
  const maxVal = Math.max(...display.map(d => d.value), 1)
  const items = display.map(d => ({ ...d, r: MIN_R + (MAX_R - MIN_R) * Math.sqrt(d.value / maxVal) }))
  const nodes = packBubbles(items)

  return (
    <div style={{
      width: SVG_W + 40,
      background: 'rgba(10, 14, 18, 0.52)',
      border: '1px solid rgba(255,255,255,0.14)',
      borderRadius: 18,
      backdropFilter: 'blur(8px)',
      padding: '20px 20px',
      pointerEvents: 'auto',
    }}>
      <svg width={SVG_W} height={SVG_H}>
        <text x={SVG_W / 2} y={20} textAnchor="middle" fill="white" style={{ fontSize: 16, fontWeight: 700 }}>
          Fishing Effort by Country
        </text>
        <text x={SVG_W / 2} y={36} textAnchor="middle" fill="rgba(255,255,255,0.5)" style={{ fontSize: 10 }}>
          visible area
        </text>

        {nodes.map((node, i) => {
          const isHov = hoveredIndex === i
          const r = node.r * (isHov ? 1.13 : 1)
          return (
            <g key={node.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}>
              <circle cx={node.x} cy={node.y} r={r}
                fill={node.color} opacity={isHov ? 1 : 0.82}
                stroke={isHov ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)'}
                strokeWidth={isHov ? 2.5 : 1}
                style={{ transition: 'r 0.2s ease, opacity 0.2s ease' }} />
              {node.r >= 22 && (
                <text x={node.x} y={node.y - (node.r > 36 ? 7 : 1)}
                  textAnchor="middle" dominantBaseline="middle" fill="white"
                  style={{ fontSize: Math.max(9, Math.min(13, node.r * 0.33)), fontWeight: 700, pointerEvents: 'none' }}>
                  {node.label}
                </text>
              )}
              {node.r >= 30 && (
                <text x={node.x} y={node.y + node.r * 0.38}
                  textAnchor="middle" fill="rgba(255,255,255,0.85)"
                  style={{ fontSize: Math.max(8, Math.min(11, node.r * 0.27)), pointerEvents: 'none' }}>
                  {node.value.toFixed(1)}%
                </text>
              )}
            </g>
          )
        })}

        {hoveredIndex !== null && (
          <g>
            <rect x={SVG_W / 2 - 90} y={SVG_H - 22} width={180} height={18} rx={5}
              fill="rgba(0,0,0,0.7)" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
            <text x={SVG_W / 2} y={SVG_H - 11} textAnchor="middle"
              fill="rgba(255,255,255,0.92)" style={{ fontSize: 11 }}>
              {nodes[hoveredIndex]?.label} — {nodes[hoveredIndex]?.value.toFixed(2)}%
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
