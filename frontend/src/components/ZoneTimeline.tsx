import { theme } from '../theme'
import TimelineBar, { type TimelineMarker } from './TimelineBar'

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTH_ABBR = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

interface ZoneTimelineProps {
  dates: string[]
  index: number
  isPlaying: boolean
  onSeek: (index: number) => void
  onPlayPause: () => void
  onExit: () => void
}

/**
 * Zone-mode timeline — scrubs a single precomputed year of frames by index,
 * with month ticks. The leading button exits back to the explore map.
 */
export default function ZoneTimeline({
  dates, index, isPlaying, onSeek, onPlayPause, onExit,
}: ZoneTimelineProps) {
  const maxIndex = Math.max(dates.length - 1, 0)
  const currentDate = dates[index] ?? dates[0] ?? ''
  const [, m, d] = currentDate ? currentDate.split('-').map(Number) : [0, 1, 1]

  // First frame index of each month → a tick position.
  const markers: TimelineMarker[] = []
  let seenMonth = 0
  dates.forEach((date, i) => {
    const month = Number(date.slice(5, 7))
    if (month !== seenMonth) {
      seenMonth = month
      markers.push({
        key: month,
        label: MONTH_ABBR[month - 1],
        pct: maxIndex > 0 ? (i / maxIndex) * 100 : 0,
        active: month === m,
      })
    }
  })

  const exitButton = (
    <button
      className="tl-play-btn"
      onClick={onExit}
      title="Back to map"
      style={{
        flexShrink: 0,
        width: 44, height: 44,
        borderRadius: '50%',
        border: `1px solid ${theme.border}`,
        background: 'rgba(15,23,42,0.04)',
        color: theme.textPrimary,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4L6 9l5 5" />
      </svg>
    </button>
  )

  return (
    <TimelineBar
      index={index}
      maxIndex={maxIndex}
      isPlaying={isPlaying}
      onSeekIndex={onSeek}
      onPlayPause={onPlayPause}
      markers={markers}
      bigLabel={String(d).padStart(2, '0')}
      smallLabel={currentDate ? `${MONTHS_EN[m - 1]} ${currentDate.slice(0, 4)}` : ''}
      leadingButton={exitButton}
    />
  )
}
