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

interface MapLegendProps {
  maxHours: number
}

const BAR_H = 110

export default function MapLegend({ maxHours }: MapLegendProps) {
  const ticks = [
    { label: fmt(maxHours),       pct: 100, highlight: 'rgb(255,200,0)'   },
    { label: fmt(maxHours * 0.75),pct: 75,  highlight: null                },
    { label: fmt(maxHours * 0.5), pct: 50,  highlight: null                },
    { label: fmt(maxHours * 0.25),pct: 25,  highlight: null                },
    { label: '0',                 pct: 0,   highlight: 'rgb(100,130,220)'  },
  ]

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      zIndex: 20,
      background: 'rgba(7, 11, 16, 0.78)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 14,
      padding: '12px 14px 12px 12px',
      pointerEvents: 'none',
      userSelect: 'none',
      minWidth: 110,
    }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.75)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom: 3,
      }}>
        Fishing Hours
      </div>
      <div style={{
        fontSize: 9,
        color: 'rgba(255,255,255,0.35)',
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
              <div style={{ width: 5, height: 1, background: 'rgba(255,255,255,0.25)' }} />
              <span style={{
                fontSize: 9,
                color: highlight ?? 'rgba(255,255,255,0.4)',
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
