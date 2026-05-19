import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { MapViewState } from '@deck.gl/core'
import { zoomToResolution, MAX_FLAGS } from '../utils'
import { useDataController } from './useDataController'
import type { FishingCell } from '../api/fishing'
import { DATE_MIN, DATE_MAX } from '../constants'

export { DATE_MIN, DATE_MAX }

interface State {
  currentDate: string
  viewState: MapViewState
}

type Action =
  | { type: 'SEEK'; date: string }
  | { type: 'SET_VIEW_STATE'; viewState: MapViewState }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SEEK':
      return { ...state, currentDate: action.date }
    case 'SET_VIEW_STATE':
      return { ...state, viewState: action.viewState }
    default:
      return state
  }
}

/**
 * Explore-mode map state. The timeline is seek-only — there is no auto-advance
 * playback (zone timelapses cover animated playback instead).
 */
export function useMapState(initialDate: string, initialViewState: MapViewState) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, dispatch] = useReducer(reducer, {
    currentDate: initialDate,
    viewState: initialViewState,
  })

  const [selectedFlags, setSelectedFlags] = useState<string[]>([])

  const currentResolution = zoomToResolution(state.viewState.zoom)
  const { data, loading } = useDataController(state.currentDate, currentResolution, selectedFlags, containerRef, state.viewState)

  const [displayData, setDisplayData] = useState<Map<string, FishingCell[]>>(data)
  useEffect(() => {
    if (!loading) setDisplayData(data)
  }, [loading, data])

  // Toggle a flag in/out of the selection, capped at MAX_FLAGS.
  const toggleFlag = useCallback((flag: string) => {
    setSelectedFlags(prev => {
      if (prev.includes(flag)) return prev.filter(f => f !== flag)
      if (prev.length >= MAX_FLAGS) return prev
      return [...prev, flag]
    })
  }, [])
  const clearFlags = useCallback(() => setSelectedFlags([]), [])

  const onViewStateChange = useCallback((vs: MapViewState) => dispatch({ type: 'SET_VIEW_STATE', viewState: vs }), [])
  const seek = useCallback((date: string) => dispatch({ type: 'SEEK', date }), [])

  return {
    data: displayData,
    loading,
    viewState: state.viewState,
    resolution: currentResolution,
    containerRef,
    currentDate: state.currentDate,
    selectedFlags,
    toggleFlag,
    clearFlags,
    onViewStateChange,
    seek,
  }
}
