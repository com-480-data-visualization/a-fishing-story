import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { MapViewState } from '@deck.gl/core'
import { fetchFishingRange, type FishingCell } from '../api/fishing'
import { computeBBox, nextDay } from '../utils'

const REPLAY_INTERVAL_MS = 200

export function useReplayData(
  enabled: boolean,
  dateStart: string | null,
  dateEnd: string | null,
  resolution: number,
  flags: string[],
  containerRef: RefObject<HTMLDivElement | null>,
  viewState: MapViewState,
): { data: Map<string, FishingCell[]>; currentDate: string | null } {
  const [rangeData, setRangeData] = useState<Map<string, Map<string, FishingCell[]>> | null>(null)
  const [currentDate, setCurrentDate] = useState<string | null>(dateStart)
  const viewStateRef = useRef(viewState)
  viewStateRef.current = viewState

  const flagsKey = flags.join(',')

  // Reset when the date range or flags change (new replay session)
  useEffect(() => {
    setRangeData(null)
    setCurrentDate(dateStart)
  }, [dateStart, dateEnd, flagsKey])

  // Fetch all flags in parallel once when enabled and data not yet loaded
  useEffect(() => {
    if (!enabled || !dateStart || !dateEnd || rangeData !== null) return
    const bbox = computeBBox(containerRef.current, viewStateRef.current)
    const flagsToFetch = flags.length > 0 ? flags : ['']
    Promise.all(
      flagsToFetch.map(flag =>
        fetchFishingRange(dateStart, dateEnd, resolution, flag || undefined, undefined, bbox)
          .then(dateMap => [flag, dateMap] as [string, Map<string, FishingCell[]>])
      )
    ).then(flagEntries => {
      // Merge: Map<date, Map<flag, FishingCell[]>>
      const merged = new Map<string, Map<string, FishingCell[]>>()
      for (const [flag, dateMap] of flagEntries) {
        for (const [date, cells] of dateMap) {
          if (!merged.has(date)) merged.set(date, new Map())
          merged.get(date)!.set(flag, cells)
        }
      }
      setRangeData(merged)
    })
  }, [enabled, dateStart, dateEnd, flagsKey, rangeData]) // eslint-disable-line react-hooks/exhaustive-deps

  // Drive the tick interval once data is loaded
  useEffect(() => {
    if (!enabled || !rangeData) return
    const id = setInterval(() => {
      setCurrentDate(prev => {
        if (!prev) return prev
        const next = nextDay(prev)
        return rangeData.has(next) ? next : prev
      })
    }, REPLAY_INTERVAL_MS)
    return () => clearInterval(id)
  }, [enabled, rangeData])

  const data = rangeData?.get(currentDate ?? '') ?? new Map<string, FishingCell[]>()

  return { data, currentDate }
}
