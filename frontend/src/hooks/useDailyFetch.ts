import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { MapViewState } from '@deck.gl/core'
import { fetchFishingDaily, type FishingCell, type BBox } from '../api/fishing'
import { bboxExceedsFetched, computeBBox } from '../utils'

export function useDailyFetch(
  date: string | null,
  resolution: number,
  flags: string[],
  containerRef: RefObject<HTMLDivElement | null>,
  viewState: MapViewState,
): Map<string, FishingCell[]> {
  const [data, setData] = useState<Map<string, FishingCell[]>>(new Map())
  const fetchedBBoxRef = useRef<BBox | undefined>(undefined)
  const flagsKey = flags.join(',')

  // Clear bbox cache when date, resolution, or flags change to force a refetch
  useEffect(() => {
    fetchedBBoxRef.current = undefined
  }, [date, resolution, flagsKey])

  useEffect(() => {
    if (!date) return
    const bbox = computeBBox(containerRef.current, viewState)
    if (!bbox) return
    if (fetchedBBoxRef.current && !bboxExceedsFetched(bbox, fetchedBBoxRef.current)) return

    const lonPad = (bbox.lon_max - bbox.lon_min) * 0.5
    const latPad = (bbox.lat_max - bbox.lat_min) * 0.5
    const paddedBBox = {
      lon_min: Math.max(bbox.lon_min - lonPad, -180),
      lon_max: Math.min(bbox.lon_max + lonPad, 180),
      lat_min: Math.max(bbox.lat_min - latPad, -90),
      lat_max: Math.min(bbox.lat_max + latPad, 90),
    }
    fetchedBBoxRef.current = paddedBBox

    // flags=[] means global (no filter), represented by the empty-string key
    const flagsToFetch = flags.length > 0 ? flags : ['']
    Promise.all(
      flagsToFetch.map(flag =>
        fetchFishingDaily(date, resolution, flag || undefined, undefined, paddedBBox)
          .then(cells => [flag, cells] as [string, FishingCell[]])
      )
    ).then(entries => setData(new Map(entries)))
  }, [date, resolution, flagsKey, viewState]) // eslint-disable-line react-hooks/exhaustive-deps

  return data
}
