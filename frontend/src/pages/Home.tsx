import { useEffect, useRef } from 'react'
import MapView from '../components/Map'
import { useMapState } from '../hooks/useMapState'

const INITIAL_DATE = '2023-01-01'
const INITIAL_VIEW = { longitude: 126.48, latitude: 32.44, zoom: 6 }
const REPLAY_DATE_START = '2023-01-01'
const REPLAY_DATE_END = '2023-02-28'

export default function Home() {
  const { data, viewState, resolution, mode, containerRef, onViewStateChange, startReplay, stopReplay } =
    useMapState(INITIAL_DATE, INITIAL_VIEW)

  const isReplay = mode.type === 'replay'

  const toggleRef = useRef<() => void>(() => {})
  toggleRef.current = () => {
    if (isReplay) stopReplay()
    else startReplay(REPLAY_DATE_START, REPLAY_DATE_END)
  }

  // Space bar toggles replay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        toggleRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div style={{ width: '100%', height: '100svh', position: 'relative' }}>
      <MapView
        data={data}
        viewState={viewState}
        resolution={resolution}
        containerRef={containerRef}
        onViewStateChange={onViewStateChange}
        locked={isReplay}
      />
      <button
        onClick={() => toggleRef.current()}
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 20px',
          background: isReplay ? '#c0392b' : '#2980b9',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 14,
          letterSpacing: '0.05em',
        }}
      >
        {isReplay ? '■ Stop' : '▶ Replay'}
      </button>
    </div>
  )
}
