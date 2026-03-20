import { useEffect, useReducer, useRef, useState } from 'react'
import type { MapViewState } from '@deck.gl/core'
import { fetchFishingDaily, fetchFishingRange, type FishingCell, type BBox } from '../api/fishing'
import { bboxExceedsFetched, computeBBox, nextDay, zoomToResolution } from '../utils'

const REPLAY_INTERVAL_MS = 200

// --- FSM types ---

type DailyMode = {
  type: 'daily'
  date: string
}

type ReplayMode = {
  type: 'replay'
  dateStart: string
  dateEnd: string
  currentDate: string
  rangeData: Map<string, FishingCell[]> | null
}

export type MapMode = DailyMode | ReplayMode

interface State {
  mode: MapMode
  viewState: MapViewState
  fetchKey: number
}

type Action =
  | { type: 'SET_DATE'; date: string }
  | { type: 'SET_VIEW_STATE'; viewState: MapViewState }
  | { type: 'TRIGGER_REFETCH' }
  | { type: 'START_REPLAY'; dateStart: string; dateEnd: string }
  | { type: 'RANGE_LOADED'; rangeData: Map<string, FishingCell[]> }
  | { type: 'TICK' }
  | { type: 'STOP_REPLAY' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_DATE':
      if (state.mode.type !== 'daily') return state
      return { ...state, mode: { ...state.mode, date: action.date } }

    case 'SET_VIEW_STATE':
      return { ...state, viewState: action.viewState }

    case 'TRIGGER_REFETCH':
      return { ...state, fetchKey: state.fetchKey + 1 }

    case 'START_REPLAY':
      return {
        ...state,
        mode: {
          type: 'replay',
          dateStart: action.dateStart,
          dateEnd: action.dateEnd,
          currentDate: action.dateStart,
          rangeData: null,
        },
      }

    case 'RANGE_LOADED':
      if (state.mode.type !== 'replay') return state
      return { ...state, mode: { ...state.mode, rangeData: action.rangeData } }

    case 'TICK': {
      if (state.mode.type !== 'replay' || !state.mode.rangeData) return state
      const next = nextDay(state.mode.currentDate)
      if (!state.mode.rangeData.has(next)) return state
      return { ...state, mode: { ...state.mode, currentDate: next } }
    }

    case 'STOP_REPLAY':
      if (state.mode.type !== 'replay') return state
      return { ...state, mode: { type: 'daily', date: state.mode.currentDate } }

    default:
      return state
  }
}

export function useMapState(initialDate: string, initialViewState: MapViewState) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fetchedBBoxRef = useRef<BBox | undefined>(undefined)
  const [state, dispatch] = useReducer(reducer, {
    mode: { type: 'daily', date: initialDate },
    viewState: initialViewState,
    fetchKey: 0,
  })
  const [displayData, setDisplayData] = useState<FishingCell[]>([])

  // Derived values to use as effect dependencies
  const currentResolution = zoomToResolution(state.viewState.zoom)
  const dailyDate = state.mode.type === 'daily' ? state.mode.date : null
  const replayCurrentDate = state.mode.type === 'replay' ? state.mode.currentDate : null
  const replayRangeData = state.mode.type === 'replay' ? state.mode.rangeData : null
  const needsRangeFetch = state.mode.type === 'replay' && state.mode.rangeData === null
  const replayDateStart = state.mode.type === 'replay' ? state.mode.dateStart : null
  const replayDateEnd = state.mode.type === 'replay' ? state.mode.dateEnd : null
  const replayRunning = state.mode.type === 'replay' && state.mode.rangeData !== null

  // Daily mode: fetch data when date, resolution, or viewport moves outside fetched bounds.
  useEffect(() => {
    if (!dailyDate) return
    const bbox = computeBBox(containerRef.current, state.viewState)
    fetchedBBoxRef.current = bbox
    fetchFishingDaily(dailyDate, currentResolution, undefined, undefined, bbox).then(setDisplayData)
  }, [dailyDate, currentResolution, state.fetchKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Replay mode: fetch the full range once when entering replay (rangeData is null).
  useEffect(() => {
    if (!needsRangeFetch || !replayDateStart || !replayDateEnd) return
    const bbox = computeBBox(containerRef.current, state.viewState)
    fetchFishingRange(replayDateStart, replayDateEnd, currentResolution, undefined, undefined, bbox)
      .then(rangeData => dispatch({ type: 'RANGE_LOADED', rangeData }))
  }, [needsRangeFetch, replayDateStart, replayDateEnd]) // eslint-disable-line react-hooks/exhaustive-deps

  // Replay mode: update displayed cells when the current date advances.
  useEffect(() => {
    if (!replayCurrentDate || !replayRangeData) return
    setDisplayData(replayRangeData.get(replayCurrentDate) ?? [])
  }, [replayCurrentDate, replayRangeData])

  // Replay mode: drive the tick interval once rangeData is loaded.
  useEffect(() => {
    if (!replayRunning) return
    const id = setInterval(() => dispatch({ type: 'TICK' }), REPLAY_INTERVAL_MS)
    return () => clearInterval(id)
  }, [replayRunning])

  return {
    data: displayData,
    viewState: state.viewState,
    resolution: currentResolution,
    mode: state.mode,
    containerRef,
    onViewStateChange: (vs: MapViewState) => {
      dispatch({ type: 'SET_VIEW_STATE', viewState: vs })
      // In daily mode, trigger a refetch when the viewport moves outside the last fetched bbox.
      if (state.mode.type === 'daily') {
        const currentBBox = computeBBox(containerRef.current, vs)
        if (currentBBox && fetchedBBoxRef.current && bboxExceedsFetched(currentBBox, fetchedBBoxRef.current)) {
          dispatch({ type: 'TRIGGER_REFETCH' })
        }
      }
    },
    startReplay: (dateStart: string, dateEnd: string) =>
      dispatch({ type: 'START_REPLAY', dateStart, dateEnd }),
    stopReplay: () => dispatch({ type: 'STOP_REPLAY' }),
    setDate: (date: string) => dispatch({ type: 'SET_DATE', date }),
  }
}
