import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { MapViewState } from '@deck.gl/core'
import { zoomToResolution, nextDay } from '../utils'
import { useDataController } from './useDataController'
import type { FishingCell } from '../api/fishing'
import { DATE_MIN, DATE_MAX } from '../constants'

export { DATE_MIN, DATE_MAX }

const PLAY_INTERVAL_MS = 500

interface State {
  currentDate: string
  isPlaying: boolean
  viewState: MapViewState
}

type Action =
  | { type: 'SEEK'; date: string }
  | { type: 'SET_VIEW_STATE'; viewState: MapViewState }
  | { type: 'SET_PLAYING'; playing: boolean }
  | { type: 'TICK' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SEEK':
      return { ...state, currentDate: action.date, isPlaying: false }
    case 'SET_VIEW_STATE':
      return { ...state, viewState: action.viewState }
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.playing }
    case 'TICK': {
      const next = nextDay(state.currentDate)
      if (next > DATE_MAX) return { ...state, isPlaying: false }
      return { ...state, currentDate: next }
    }
    default:
      return state
  }
}

export function useMapState(initialDate: string, initialViewState: MapViewState) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, dispatch] = useReducer(reducer, {
    currentDate: initialDate,
    isPlaying: false,
    viewState: initialViewState,
  })

  const [selectedFlag, setSelectedFlag] = useState<string | null>(null)

  const currentResolution = zoomToResolution(state.viewState.zoom)
  const flags = selectedFlag ? [selectedFlag] : []
  const { data, loading } = useDataController(state.currentDate, currentResolution, flags, containerRef, state.viewState)

  const [displayData, setDisplayData] = useState<Map<string, FishingCell[]>>(data)
  useEffect(() => {
    if (!loading) setDisplayData(data)
  }, [loading, data])

  useEffect(() => {
    if (!state.isPlaying) return
    const id = setInterval(() => dispatch({ type: 'TICK' }), PLAY_INTERVAL_MS)
    return () => clearInterval(id)
  }, [state.isPlaying])

  const onViewStateChange = useCallback((vs: MapViewState) => dispatch({ type: 'SET_VIEW_STATE', viewState: vs }), [])
  const seek  = useCallback((date: string) => dispatch({ type: 'SEEK', date }), [])
  const play  = useCallback(() => dispatch({ type: 'SET_PLAYING', playing: true }), [])
  const pause = useCallback(() => dispatch({ type: 'SET_PLAYING', playing: false }), [])

  return {
    data: displayData,
    loading,
    viewState: state.viewState,
    resolution: currentResolution,
    containerRef,
    currentDate: state.currentDate,
    isPlaying: state.isPlaying,
    selectedFlag,
    setSelectedFlag,
    onViewStateChange,
    seek,
    play,
    pause,
  }
}
