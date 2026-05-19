import { DATE_MIN, DATE_MAX } from '../hooks/useMapState'
import TimelineBar, { type TimelineMarker } from './TimelineBar'

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

const START_YEAR = Number(DATE_MIN.slice(0, 4))
const END_YEAR   = Number(DATE_MAX.slice(0, 4))

interface TimelineProps {
  currentDate: string
  onSeek: (date: string) => void
}

/**
 * Explore-mode timeline — a seek-only scrubber over the full DATE_MIN…DATE_MAX
 * range. Animated playback lives in zone timelapses, not here.
 */
export default function Timeline({ currentDate, onSeek }: TimelineProps) {
  const [y, m, d] = currentDate.split('-').map(Number)

  const markers: TimelineMarker[] = Array.from(
    { length: END_YEAR - START_YEAR + 1 },
    (_, i) => {
      const year = START_YEAR + i
      return {
        key: year,
        label: String(year),
        pct: (dateToIndex(`${year}-01-01`) / TOTAL_DAYS) * 100,
        active: year === y,
      }
    },
  )

  return (
    <TimelineBar
      index={dateToIndex(currentDate)}
      maxIndex={TOTAL_DAYS}
      onSeekIndex={i => onSeek(indexToDate(i))}
      markers={markers}
      bigLabel={String(d).padStart(2, '0')}
      smallLabel={`${MONTHS_EN[m - 1]} ${y}`}
    />
  )
}
