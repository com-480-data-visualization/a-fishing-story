import { useRef } from 'react'
import type { ReactNode } from 'react'
import { theme } from '../theme'

/** A tick under the slider — a year (explore) or a month (zone timelapse). */
export interface TimelineMarker {
  key: string | number
  label: string
  pct: number
  active: boolean
}

interface TimelineBarProps {
  index: number
  maxIndex: number
  onSeekIndex: (index: number) => void
  /** Playback controls. Omit `onPlayPause` for a seek-only timeline. */
  isPlaying?: boolean
  onPlayPause?: () => void
  markers: TimelineMarker[]
  /** Large primary readout (e.g. the day number). */
  bigLabel: string
  /** Small secondary readout (e.g. "MARCH 2023"). */
  smallLabel: string
  /** Optional control rendered before the play button (e.g. an exit button). */
  leadingButton?: ReactNode
}

/**
 * Presentational timeline bar — a play/pause button, an index slider with
 * labelled tick markers, and a date readout. Shared by the explore-mode
 * `Timeline` and the zone-mode `ZoneTimeline`; both are thin wrappers that map
 * their domain (a global date range / a year of frames) onto a plain index.
 */
export default function TimelineBar({
  index, maxIndex, isPlaying,
  onSeekIndex, onPlayPause,
  markers, bigLabel, smallLabel, leadingButton,
}: TimelineBarProps) {
  const isDraggingRef = useRef(false)
  const progress = maxIndex > 0 ? (index / maxIndex) * 100 : 0
  const sliderBg = `linear-gradient(to right, ${theme.accent} ${progress}%, rgba(15,23,42,0.12) ${progress}%)`

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
          box-shadow: 0 0 0 3px ${theme.accent}, 0 1px 4px rgba(20,30,50,0.3);
          cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s;
        }
        .tl-slider:hover::-webkit-slider-thumb {
          transform: scale(1.3);
          box-shadow: 0 0 0 5px rgba(37,99,235,0.35), 0 1px 5px rgba(20,30,50,0.35);
        }
        .tl-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          border: none;
          box-shadow: 0 0 0 3px ${theme.accent};
          cursor: pointer;
        }
        .tl-play-btn {
          transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
        }
        .tl-play-btn:hover {
          background: rgba(15,23,42,0.06) !important;
          transform: scale(1.06);
        }
        .tl-play-btn:active { transform: scale(0.96); }
      `}</style>

      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 80,
        background: theme.panelBg,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderTop: `1px solid ${theme.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '0 28px',
        zIndex: 25,
        userSelect: 'none',
      }}>

        {leadingButton}

        {/* Play / Pause button — omitted for a seek-only timeline */}
        {onPlayPause && (
          <button
            className="tl-play-btn"
            onClick={onPlayPause}
            title={isPlaying ? 'Pause' : 'Play'}
            style={{
              flexShrink: 0,
              width: 44, height: 44,
              borderRadius: '50%',
              border: `1px solid ${isPlaying ? theme.accentBorder : theme.border}`,
              background: isPlaying ? theme.accentBg : 'rgba(15,23,42,0.04)',
              color: isPlaying ? theme.accent : theme.textPrimary,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isPlaying ? '0 0 14px rgba(37,99,235,0.2)' : 'none',
            }}
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="3" y="2" width="4" height="12" rx="1.5" />
                <rect x="9" y="2" width="4" height="12" rx="1.5" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2.5L13 8L4 13.5V2.5Z" />
              </svg>
            )}
          </button>
        )}

        {/* Slider + tick markers */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            type="range"
            className="tl-slider"
            min={0}
            max={maxIndex}
            value={index}
            style={{ background: sliderBg }}
            onMouseDown={() => { isDraggingRef.current = true }}
            onMouseUp={() => { isDraggingRef.current = false }}
            onChange={e => onSeekIndex(Number(e.target.value))}
          />

          <div style={{ position: 'relative', height: 14 }}>
            {markers.map(({ key, label, pct, active }) => (
              <div
                key={key}
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
                <div style={{ width: 1, height: 4, background: theme.borderStrong }} />
                <span style={{
                  fontSize: 10,
                  color: active ? theme.accent : theme.textMuted,
                  fontWeight: active ? 600 : 400,
                  letterSpacing: '0.04em',
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Date readout */}
        <div style={{ flexShrink: 0, textAlign: 'right', lineHeight: 1.15 }}>
          <div style={{
            fontSize: 26,
            fontWeight: 700,
            color: theme.textPrimary,
            letterSpacing: '-0.5px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {bigLabel}
          </div>
          <div style={{
            fontSize: 11,
            color: theme.textMuted,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            {smallLabel}
          </div>
        </div>

      </div>
    </>
  )
}
