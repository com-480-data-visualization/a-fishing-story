import { useRef } from 'react'
import { DATE_MIN, DATE_MAX } from '../hooks/useMapState'

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MS_PER_DAY = 86400000
const T_MIN = new Date(DATE_MIN).getTime()
const T_MAX = new Date(DATE_MAX).getTime()
const TOTAL_DAYS = Math.round((T_MAX - T_MIN) / MS_PER_DAY)

function dateToIndex(date: string): number {
  return Math.round((new Date(date).getTime() - T_MIN) / MS_PER_DAY)
}

function indexToDate(idx: number): string {
  return new Date(T_MIN + idx * MS_PER_DAY).toISOString().slice(0, 10)
}

function parseDate(date: string): { day: string; month: string; year: string } {
  const [y, m, d] = date.split('-').map(Number)
  return {
    day: String(d).padStart(2, '0'),
    month: MONTHS_EN[m - 1],
    year: String(y),
  }
}

const START_YEAR = Number(DATE_MIN.slice(0, 4))
const END_YEAR   = Number(DATE_MAX.slice(0, 4))
const YEAR_MARKERS = Array.from(
  { length: END_YEAR - START_YEAR + 1 },
  (_, i) => {
    const y = START_YEAR + i
    const idx = dateToIndex(`${y}-01-01`)
    return { year: y, pct: (idx / TOTAL_DAYS) * 100 }
  }
)

interface TimelineProps {
  currentDate: string
  isPlaying: boolean
  onSeek: (date: string) => void
  onPlayPause: () => void
}

export default function Timeline({ currentDate, isPlaying, onSeek, onPlayPause }: TimelineProps) {
  const { day, month, year } = parseDate(currentDate)
  const currentIdx = dateToIndex(currentDate)
  const progress = (currentIdx / TOTAL_DAYS) * 100
  const isDraggingRef = useRef(false)

  const sliderBg = `linear-gradient(to right, #38bdf8 ${progress}%, rgba(255,255,255,0.12) ${progress}%)`

  return (
    <>
      <style>{`
        .tl-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 3px;
          border-radius: 99px;
          outline: none;
          cursor: pointer;
          transition: height 0.15s;
        }
        .tl-slider:hover { height: 5px; }
        .tl-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(56,189,248,0.45), 0 2px 6px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s;
        }
        .tl-slider:hover::-webkit-slider-thumb {
          transform: scale(1.3);
          box-shadow: 0 0 0 5px rgba(56,189,248,0.3), 0 2px 8px rgba(0,0,0,0.5);
        }
        .tl-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          border: none;
          box-shadow: 0 0 0 3px rgba(56,189,248,0.45);
          cursor: pointer;
        }
        .tl-play-btn {
          transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
        }
        .tl-play-btn:hover {
          background: rgba(255,255,255,0.14) !important;
          transform: scale(1.06);
        }
        .tl-play-btn:active { transform: scale(0.96); }
      `}</style>

      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: 80,
        background: 'rgba(7, 11, 16, 0.88)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '0 28px',
        zIndex: 25,
        userSelect: 'none',
      }}>

        {/* Play / Pause button */}
        <button
          className="tl-play-btn"
          onClick={onPlayPause}
          title={isPlaying ? 'Pause' : 'Play'}
          style={{
            flexShrink: 0,
            width: 44, height: 44,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.15)',
            background: isPlaying
              ? 'rgba(56,189,248,0.18)'
              : 'rgba(255,255,255,0.07)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isPlaying ? '0 0 16px rgba(56,189,248,0.25)' : 'none',
          }}
        >
          {isPlaying ? (
            /* Pause icon */
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="4" height="12" rx="1.5" />
              <rect x="9" y="2" width="4" height="12" rx="1.5" />
            </svg>
          ) : (
            /* Play icon */
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2.5L13 8L4 13.5V2.5Z" />
            </svg>
          )}
        </button>

        {/* Slider + year labels */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            type="range"
            className="tl-slider"
            min={0}
            max={TOTAL_DAYS}
            value={currentIdx}
            style={{ background: sliderBg }}
            onMouseDown={() => { isDraggingRef.current = true }}
            onMouseUp={() => { isDraggingRef.current = false }}
            onChange={e => onSeek(indexToDate(Number(e.target.value)))}
          />

          {/* Year markers */}
          <div style={{ position: 'relative', height: 14 }}>
            {YEAR_MARKERS.map(({ year: y, pct }) => (
              <div
                key={y}
                style={{
                  position: 'absolute',
                  left: `${pct}%`,
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  pointerEvents: 'none',
                }}
              >
                <div style={{
                  width: 1,
                  height: 4,
                  background: 'rgba(255,255,255,0.2)',
                }} />
                <span style={{
                  fontSize: 10,
                  color: y === Number(year)
                    ? 'rgba(56,189,248,0.9)'
                    : 'rgba(255,255,255,0.3)',
                  fontWeight: y === Number(year) ? 600 : 400,
                  letterSpacing: '0.04em',
                }}>
                  {y}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Date display */}
        <div style={{
          flexShrink: 0,
          textAlign: 'right',
          lineHeight: 1.15,
        }}>
          <div style={{
            fontSize: 26,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.5px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {day}
          </div>
          <div style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            {month} {year}
          </div>
        </div>

      </div>
    </>
  )
}
