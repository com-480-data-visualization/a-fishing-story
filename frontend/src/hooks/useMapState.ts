import { useReducer, useRef } from 'react'
import type { MapViewState } from '@deck.gl/core'
import { zoomToResolution } from '../utils'
import { useDailyFetch } from './useDailyFetch'
import { useReplayData } from './useReplayData'

// --- FSM types ---

type DailyMode = {
  type: 'daily'
  date: string
}

type ReplayMode = {
  type: 'replay'
  dateStart: string
  dateEnd: string
}

export type MapMode = DailyMode | ReplayMode

interface State {
  mode: MapMode
  viewState: MapViewState
}

type Action =
  | { type: 'SET_DATE'; date: string }
  | { type: 'SET_VIEW_STATE'; viewState: MapViewState }
  | { type: 'START_REPLAY'; dateStart: string; dateEnd: string }
  | { type: 'STOP_REPLAY'; date: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_DATE':
      if (state.mode.type !== 'daily') return state
      return { ...state, mode: { ...state.mode, date: action.date } }

    case 'SET_VIEW_STATE':
      return { ...state, viewState: action.viewState }

    case 'START_REPLAY':
      return {
        ...state,
        mode: { type: 'replay', dateStart: action.dateStart, dateEnd: action.dateEnd },
      }

    case 'STOP_REPLAY':
      return { ...state, mode: { type: 'daily', date: action.date } }

    default:
      return state
  }
}

export function useMapState(initialDate: string, initialViewState: MapViewState, flags: string[] = []) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, dispatch] = useReducer(reducer, {
    mode: { type: 'daily', date: initialDate },
    viewState: initialViewState,
  })

  const currentResolution = zoomToResolution(state.viewState.zoom)
  const dailyDate = state.mode.type === 'daily' ? state.mode.date : null
  const replayEnabled = state.mode.type === 'replay'
  const replayDateStart = state.mode.type === 'replay' ? state.mode.dateStart : null
  const replayDateEnd = state.mode.type === 'replay' ? state.mode.dateEnd : null

  const dailyData = useDailyFetch(dailyDate, currentResolution, flags, containerRef, state.viewState)
  const { data: replayData, currentDate: replayCurrentDate } = useReplayData(
    replayEnabled,
    replayDateStart,
    replayDateEnd,
    currentResolution,
    flags,
    containerRef,
    state.viewState,
  )

  const displayData = state.mode.type === 'daily' ? dailyData : replayData

  return {
    data: displayData,
    viewState: state.viewState,
    resolution: currentResolution,
    mode: state.mode,
    containerRef,
    onViewStateChange: (vs: MapViewState) => dispatch({ type: 'SET_VIEW_STATE', viewState: vs }),
    startReplay: (dateStart: string, dateEnd: string) =>
      dispatch({ type: 'START_REPLAY', dateStart, dateEnd }),
    stopReplay: () =>
      dispatch({ type: 'STOP_REPLAY', date: replayCurrentDate ?? replayDateStart ?? initialDate }),
    setDate: (date: string) => dispatch({ type: 'SET_DATE', date }),
  }
}
