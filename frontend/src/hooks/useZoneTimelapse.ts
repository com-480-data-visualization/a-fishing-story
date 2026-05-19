import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadZoneTimelapse, type ZoneTimelapseData } from '../data/zoneTimelapse'
import type { FishingCell } from '../api/fishing'

/** Frame duration during playback (ms) — the whole year plays from memory. */
const FRAME_INTERVAL_MS = 150

interface ZoneTimelapseState {
  data: ZoneTimelapseData | null
  loading: boolean
  index: number
  isPlaying: boolean
  currentDate: string | null
  /** Current frame reshaped to Map<flag, cells> so MapView is reused unchanged. */
  frameData: Map<string, FishingCell[]>
  play: () => void
  pause: () => void
  seek: (index: number) => void
}

/**
 * Drives a zone timelapse: loads the zone-year file once, then animates a local
 * frame index over the year's dates. `selectedFlags` filters the rendered frame
 * in memory — no refetch.
 */
export function useZoneTimelapse(
  zoneId: string | null,
  year: number,
  selectedFlags: string[],
): ZoneTimelapseState {
  const [data, setData] = useState<ZoneTimelapseData | null>(null)
  const [loading, setLoading] = useState(false)
  const [index, setIndex] = useState(0)
  const [isPlaying, setPlaying] = useState(false)

  // Load (or clear) when the selected zone changes.
  useEffect(() => {
    if (!zoneId) { setData(null); return }
    let cancelled = false
    setLoading(true)
    setData(null)
    setIndex(0)
    setPlaying(false)
    loadZoneTimelapse(zoneId, year)
      // Loaded paused at the first frame — the user starts playback.
      .then(d => { if (!cancelled) setData(d) })
      .catch(err => { if (!cancelled) console.error('Zone timelapse load failed:', err) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [zoneId, year])

  // Playback — advance the frame index, looping at the end.
  useEffect(() => {
    if (!isPlaying || !data) return
    const id = setInterval(() => {
      setIndex(i => (i + 1 >= data.dates.length ? 0 : i + 1))
    }, FRAME_INTERVAL_MS)
    return () => clearInterval(id)
  }, [isPlaying, data])

  const play  = useCallback(() => setPlaying(true), [])
  const pause = useCallback(() => setPlaying(false), [])
  const seek  = useCallback((i: number) => { setPlaying(false); setIndex(i) }, [])

  const currentDate = data ? (data.dates[index] ?? null) : null

  // Reshape the current frame into Map<flag, FishingCell[]>. When no flag is
  // selected, all flags are merged into a single global layer (key '').
  const frameData = useMemo<Map<string, FishingCell[]>>(() => {
    const out = new Map<string, FishingCell[]>()
    if (!data || !currentDate) return out
    const cells = data.framesByDate.get(currentDate) ?? []

    if (selectedFlags.length === 0) {
      const merged = new Map<string, FishingCell>()
      for (const c of cells) {
        const key = `${c.lat},${c.lon}`
        const existing = merged.get(key)
        if (existing) existing.fishing_hours += c.fishing_hours
        else merged.set(key, { lat: c.lat, lon: c.lon, fishing_hours: c.fishing_hours })
      }
      out.set('', Array.from(merged.values()))
    } else {
      for (const flag of selectedFlags) out.set(flag, [])
      for (const c of cells) {
        const arr = out.get(c.flag)
        if (arr) arr.push({ lat: c.lat, lon: c.lon, fishing_hours: c.fishing_hours })
      }
    }
    return out
  }, [data, currentDate, selectedFlags])

  return { data, loading, index, isPlaying, currentDate, frameData, play, pause, seek }
}
