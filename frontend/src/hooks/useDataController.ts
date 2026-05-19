import { useEffect, useMemo, useState } from 'react'
import type { RefObject } from 'react'
import type { MapViewState } from '@deck.gl/core'
import { DataController, type QueryContext } from '../data/DataController'
import { computeBBox } from '../utils'
import type { FishingCell } from '../api/fishing'

interface Result {
  data: Map<string, FishingCell[]>
  loading: boolean
}

const EMPTY: Result = { data: new Map(), loading: false }

export function useDataController(
  date: string | null,
  resolution: number,
  flags: string[],
  containerRef: RefObject<HTMLDivElement | null>,
  viewState: MapViewState,
): Result {
  const flagsKey = flags.join(',')

  const controller = useMemo(
    () => new DataController({ resolution, flags } as QueryContext),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolution, flagsKey],
  )

  const [result, setResult] = useState<Result>(EMPTY)

  // Subscribe to controller updates; reset when controller or date changes
  useEffect(() => {
    if (!date) { setResult(EMPTY); return }
    setResult(controller.get(date))
    return controller.subscribe(() => setResult(controller.get(date)))
  }, [controller, date])

  // Trigger load whenever date, viewState, or controller changes
  useEffect(() => {
    if (!date) return
    const bbox = computeBBox(containerRef.current, viewState)
    if (!bbox) return
    controller.load(date, bbox)
  // containerRef is stable; viewState and date drive when to re-load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, date, viewState])

  return result
}
