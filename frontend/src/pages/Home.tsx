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

type Bounds = {
  west: number
  east: number
  south: number
  north: number
}

type DonutItem = {
  label: string
  value: number
  color: string
}

const SOUTH_CHINA_DONUT_DATA: DonutItem[] = [
  { label: 'CHN', value: 28.3, color: '#2E86DE' },
  { label: 'UNKNOWN-CHN', value: 17.5, color: '#FF7F0E' },
  { label: 'TWN', value: 12.9, color: '#2CA02C' },
  { label: 'UNKNOWN-TWN', value: 3.3, color: '#D62728' },
  { label: 'Other', value: 38.0, color: '#BCBD22' },
]

function getDonutColor(index: number): string {
  const palette = [
    '#2E86DE',
    '#FF7F0E',
    '#2CA02C',
    '#D62728',
    '#9467BD',
    '#8C564B',
    '#E377C2',
    '#7F7F7F',
    '#BCBD22',
    '#17BECF',
  ]

  return palette[index % palette.length]
}

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

  const total = SOUTH_CHINA_DONUT_DATA.reduce((sum, d) => sum + d.value, 0)

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

            {SOUTH_CHINA_DONUT_DATA.map((item, index) => {
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
              {SOUTH_CHINA_DONUT_DATA[hoveredIndex].label} — {SOUTH_CHINA_DONUT_DATA[hoveredIndex].value.toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function DynamicDonutOverlay({ data }: { data: DonutItem[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [chartHovered, setChartHovered] = useState(false)

  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (!data.length || total === 0) return null

  const cx = 190
  const cy = 190
  const outerR = 120
  const innerR = 72

  let cumulativeAngle = 0

  return (
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

          {data.map((item, index) => {
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
            Live
          </text>
          <text
            x={190}
            y={214}
            textAnchor="middle"
            fill="rgba(255,255,255,0.85)"
            style={{ fontSize: 14 }}
          >
            Visible area
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
            {data[hoveredIndex].label} — {data[hoveredIndex].value.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
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
  const [bounds, setBounds] = useState<Bounds | null>(null)
  const [chartData, setChartData] = useState<any>(null)
  const [showChart, setShowChart] = useState(false)

  const isInsideSouthChinaSea =
    viewState.longitude >= SOUTH_CHINA_SEA_BOUNDS.minLon &&
    viewState.longitude <= SOUTH_CHINA_SEA_BOUNDS.maxLon &&
    viewState.latitude >= SOUTH_CHINA_SEA_BOUNDS.minLat &&
    viewState.latitude <= SOUTH_CHINA_SEA_BOUNDS.maxLat

  const showSouthChinaSeaOverlay =
    southChinaSeaSelected &&
    viewState.zoom >= 4.5 &&
    isInsideSouthChinaSea

  const dynamicDonutData: DonutItem[] = (chartData?.data ?? []).map(
    (item: { label: string; value: number }, index: number) => ({
      label: item.label,
      value: item.value,
      color: getDonutColor(index),
    })
  )

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

  useEffect(() => {
    if (!bounds) return

    const controller = new AbortController()

    const fetchChartData = async () => {
      try {
        const params = new URLSearchParams({
          date: INITIAL_DATE,
          west: String(bounds.west),
          east: String(bounds.east),
          south: String(bounds.south),
          north: String(bounds.north),
        })

        const response = await fetch(
          `http://127.0.0.1:8000/api/fishing/chart?${params.toString()}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const result = await response.json()
        setChartData(result)
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch chart data:', error)
        }
      }
    }

    fetchChartData()

    return () => controller.abort()
  }, [bounds])

  return (
    <div style={{ width: '100%', height: '100svh', position: 'relative' }}>
      <MapView
        data={data}
        viewState={viewState}
        resolution={resolution}
        containerRef={containerRef}
        onViewStateChange={onViewStateChange}
        onBoundsChange={setBounds}
        locked={isReplay}
        onSouthChinaSeaClick={() => setSouthChinaSeaSelected(true)}
      />

      {showSouthChinaSeaOverlay ? (
        <SouthChinaSeaOverlay />
      ) : (
        showChart && <DynamicDonutOverlay data={dynamicDonutData} />
      )}

      <button
        onClick={() => setShowChart(prev => !prev)}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 44,
          height: 44,
          background: 'rgba(10,14,18,0.6)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
        }}
      >
        ☰
      </button>

      <button
        onClick={() => toggleRef.current()}
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 20px',
          background: isReplay ? '#c0392b' : '#2e3438',
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