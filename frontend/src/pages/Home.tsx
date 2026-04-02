import { useEffect, useRef, useState } from 'react'
import MapView from '../components/Map'
import { useMapState } from '../hooks/useMapState'

const INITIAL_DATE = '2023-01-01'
const INITIAL_VIEW = { longitude: 10, latitude: 32.44, zoom: 1.4 }
const REPLAY_DATE_START = '2023-01-01'
const REPLAY_DATE_END = '2023-02-28'

const SOUTH_CHINA_SEA_BOUNDS = {
  minLon: 110.0,
  maxLon: 127.5,
  minLat: 8.0,
  maxLat: 29.0,
}

type DonutItem = {
  label: string
  value: number
  color: string
}

const DONUT_DATA: DonutItem[] = [
  { label: 'CHN', value: 28.3, color: '#2E86DE' },
  { label: 'UNKNOWN-CHN', value: 17.5, color: '#FF7F0E' },
  { label: 'TWN', value: 12.9, color: '#2CA02C' },
  { label: 'UNKNOWN-TWN', value: 3.3, color: '#D62728' },
  { label: 'Other', value: 38.0, color: '#BCBD22' },
]

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180.0
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  }
}

function donutSlicePath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
) {
  const startOuter = polarToCartesian(cx, cy, outerR, endAngle)
  const endOuter = polarToCartesian(cx, cy, outerR, startAngle)
  const startInner = polarToCartesian(cx, cy, innerR, endAngle)
  const endInner = polarToCartesian(cx, cy, innerR, startAngle)

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y}`,
    'Z',
  ].join(' ')
}

function SouthChinaSeaOverlay() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [chartHovered, setChartHovered] = useState(false)
  const [textHovered, setTextHovered] = useState(false)

  const total = DONUT_DATA.reduce((sum, d) => sum + d.value, 0)

  const cx = 190
  const cy = 190
  const outerR = 120
  const innerR = 72

  let cumulativeAngle = 0

  return (
    <>
      <div
        onMouseEnter={() => setTextHovered(true)}
        onMouseLeave={() => setTextHovered(false)}
        style={{
          position: 'absolute',
          left: 28,
          bottom: 34,
          width: 360,
          padding: '18px 20px',
          background: 'rgba(10, 14, 18, 0.58)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 16,
          backdropFilter: 'blur(8px)',
          color: 'white',
          opacity: textHovered ? 1 : 0.68,
          transition: 'opacity 0.25s ease',
          pointerEvents: 'auto',
          zIndex: 15,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
          South China Sea
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.55, color: 'rgba(255,255,255,0.9)' }}>
          One of the world’s most contested maritime regions, the South China Sea
          concentrates overlapping territorial claims, strategic shipping lanes,
          and recurrent tensions between China, Taiwan, Japan, the Philippines,
          and neighboring states.
        </div>
      </div>

      <div
        onMouseEnter={() => setChartHovered(true)}
        onMouseLeave={() => {
          setChartHovered(false)
          setHoveredIndex(null)
        }}
        style={{
          position: 'absolute',
          right: 28,
          bottom: 26,
          width: 430,
          height: 430,
          background: 'rgba(10, 14, 18, 0.52)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 18,
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: chartHovered ? 1 : 0.68,
          transition: 'opacity 0.25s ease',
          pointerEvents: 'auto',
          zIndex: 15,
        }}
      >
        <div style={{ position: 'relative', width: 380, height: 380 }}>
          <svg width={380} height={380}>
            <text
              x={190}
              y={38}
              textAnchor="middle"
              fill="white"
              style={{ fontSize: 20, fontWeight: 700 }}
            >
              Boats by Country
            </text>

            {DONUT_DATA.map((item, index) => {
              const angle = (item.value / total) * 360
              const startAngle = cumulativeAngle
              const endAngle = cumulativeAngle + angle
              cumulativeAngle += angle

              const midAngle = (startAngle + endAngle) / 2
              const offset = hoveredIndex === index ? 10 : 0
              const offsetRad = ((midAngle - 90) * Math.PI) / 180
              const dx = offset * Math.cos(offsetRad)
              const dy = offset * Math.sin(offsetRad)

              const path = donutSlicePath(
                cx + dx,
                cy + dy,
                outerR,
                innerR,
                startAngle,
                endAngle
              )

              return (
                <path
                  key={item.label}
                  d={path}
                  fill={item.color}
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={hoveredIndex === index ? 3 : 2}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.22s ease',
                    filter: hoveredIndex === index ? 'brightness(1.08)' : 'none',
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                />
              )
            })}

            <text
              x={190}
              y={182}
              textAnchor="middle"
              fill="white"
              style={{ fontSize: 18, fontWeight: 700 }}
            >
              2024
            </text>
            <text
              x={190}
              y={214}
              textAnchor="middle"
              fill="rgba(255,255,255,0.85)"
              style={{ fontSize: 14 }}
            >
              Share of boats
            </text>
          </svg>

          {hoveredIndex !== null && (
            <div
              style={{
                position: 'absolute',
                top: 52,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.82)',
                color: 'white',
                borderRadius: 10,
                fontSize: 13,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                border: '1px solid rgba(255,255,255,0.14)',
              }}
            >
              {DONUT_DATA[hoveredIndex].label} — {DONUT_DATA[hoveredIndex].value.toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function Home() {
  const {
    data,
    viewState,
    resolution,
    mode,
    containerRef,
    onViewStateChange,
    startReplay,
    stopReplay,
  } = useMapState(INITIAL_DATE, INITIAL_VIEW, [])

  const isReplay = mode.type === 'replay'
  const [southChinaSeaSelected, setSouthChinaSeaSelected] = useState(false)

  const isInsideSouthChinaSea =
    viewState.longitude >= SOUTH_CHINA_SEA_BOUNDS.minLon &&
    viewState.longitude <= SOUTH_CHINA_SEA_BOUNDS.maxLon &&
    viewState.latitude >= SOUTH_CHINA_SEA_BOUNDS.minLat &&
    viewState.latitude <= SOUTH_CHINA_SEA_BOUNDS.maxLat

  const showSouthChinaSeaOverlay =
    southChinaSeaSelected &&
    viewState.zoom >= 4.5 &&
    isInsideSouthChinaSea


  const toggleRef = useRef<() => void>(() => {})
  toggleRef.current = () => {
    if (isReplay) stopReplay()
    else startReplay(REPLAY_DATE_START, REPLAY_DATE_END)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        toggleRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div style={{ width: '100%', height: '100svh', position: 'relative' }}>
      <MapView
        data={data}
        viewState={viewState}
        resolution={resolution}
        containerRef={containerRef}
        onViewStateChange={onViewStateChange}
        locked={isReplay}
        onSouthChinaSeaClick={() => setSouthChinaSeaSelected(true)}
      />

      {showSouthChinaSeaOverlay && <SouthChinaSeaOverlay />}

      <button
        onClick={() => toggleRef.current()}
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 20px',
          background: isReplay ? '#c0392b' : '#2980b9',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 14,
          letterSpacing: '0.05em',
          zIndex: 20,
        }}
      >
        {isReplay ? '■ Stop' : '▶ Replay'}
      </button>
    </div>
  )
}