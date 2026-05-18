import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MapViewState } from '@deck.gl/core'
import type { Map as MaplibreMap } from 'maplibre-gl'

import MapView from '../components/Map'
import ZonePin from '../components/ZonePin'
import ZoneInfoPanel from '../components/ZoneInfoPanel'
import ChartPanel from '../components/ChartPanel'
import Timeline from '../components/Timeline'
import MapLegend from '../components/MapLegend'
import MapControls from '../components/MapControls'
import FlagPicker from '../components/FlagPicker'

import { ZONES } from '../data/zones'
import type { Zone } from '../data/zones'
import { useMapState } from '../hooks/useMapState'
import { useViewportCharts } from '../hooks/useViewportCharts'

const INITIAL_DATE = '2023-01-01'
const INITIAL_VIEW = { longitude: 10, latitude: 32.44, zoom: 1.4 }

const ZONE_SELECT_GRACE_MS = 2000

export default function Home() {
  const {
    data, viewState, resolution, containerRef,
    currentDate, isPlaying,
    selectedFlag, setSelectedFlag,
    onViewStateChange, seek, play, pause,
  } = useMapState(INITIAL_DATE, INITIAL_VIEW)

  const [mapInstance, setMapInstance] = useState<MaplibreMap | null>(null)
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [showEEZ, setShowEEZ] = useState(false)
  const [flagPickerOpen, setFlagPickerOpen] = useState(false)

  // Bumped whenever the map container resizes so viewport-scoped charts refetch.
  const [resizeNonce, setResizeNonce] = useState(0)
  const handleMapResize = useCallback(() => setResizeNonce(n => n + 1), [])

  const { bubbleData, illegalData, timeSeriesData } =
    useViewportCharts(containerRef, viewState, currentDate, resizeNonce)

  const maxHours = useMemo(() => {
    let max = 0
    for (const cells of data.values())
      for (const cell of cells)
        if (cell.fishing_hours > max) max = cell.fishing_hours
    return max
  }, [data])

  const lastZoneSelectTime = useRef<number>(0)

  const handleZoneClick = (zone: Zone) => {
    lastZoneSelectTime.current = Date.now()
    onViewStateChange({
      ...viewState,
      longitude: zone.lon,
      latitude: zone.lat,
      zoom: zone.zoom,
      transitionDuration: 1400,
    } as MapViewState)
    setSelectedZone(zone)
    setPanelOpen(true)
  }

  useEffect(() => {
    if (!selectedZone) return
    if (Date.now() - lastZoneSelectTime.current < ZONE_SELECT_GRACE_MS) return
    const dLon = Math.abs(viewState.longitude - selectedZone.lon)
    const wrappedDLon = Math.min(dLon, 360 - dLon)
    const dLat = Math.abs(viewState.latitude - selectedZone.lat)
    const dist = Math.sqrt(wrappedDLon * wrappedDLon + dLat * dLat)
    if (viewState.zoom < 3.5 || dist > 20) setSelectedZone(null)
  }, [viewState.longitude, viewState.latitude, viewState.zoom, selectedZone])

  // Spacebar toggles play/pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        isPlaying ? pause() : play()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPlaying, play, pause])

  return (
    <div style={{ width: '100%', height: '100svh', display: 'flex', overflow: 'hidden' }}>
      <style>{`
        @keyframes zoneBeaconPulse {
          0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 0.9; }
          100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
        }
        @keyframes zoneFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Map area — flexes to fill the space left by the chart panel */}
      <div style={{ position: 'relative', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <MapView
          data={data}
          viewState={viewState}
          resolution={resolution}
          containerRef={containerRef}
          onViewStateChange={onViewStateChange}
          locked={isPlaying}
          onMapInstance={setMapInstance}
          onResize={handleMapResize}
          showEEZ={showEEZ}
        />

        {mapInstance && viewState.zoom < 5.5 && ZONES.map(zone => {
          const px = mapInstance.project([zone.lon, zone.lat])
          return (
            <div key={zone.id} style={{ position: 'absolute', left: px.x, top: px.y, zIndex: 10, pointerEvents: 'auto' }}>
              <ZonePin zone={zone} isSelected={selectedZone?.id === zone.id} onZoneClick={handleZoneClick} />
            </div>
          )
        })}

        {selectedZone && (
          <ZoneInfoPanel zone={selectedZone} onClose={() => setSelectedZone(null)} />
        )}

        <MapLegend maxHours={maxHours} />

        <MapControls
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen(prev => !prev)}
          flagActive={selectedFlag !== null}
          flagPickerOpen={flagPickerOpen}
          onToggleFlagPicker={() => setFlagPickerOpen(prev => !prev)}
          showEEZ={showEEZ}
          onToggleEEZ={() => setShowEEZ(prev => !prev)}
        />

        <FlagPicker
          key={flagPickerOpen ? 'open' : 'closed'}
          selectedFlag={selectedFlag}
          onSelect={setSelectedFlag}
          open={flagPickerOpen}
          onClose={() => setFlagPickerOpen(false)}
        />

        <Timeline
          currentDate={currentDate}
          isPlaying={isPlaying}
          onSeek={seek}
          onPlayPause={() => isPlaying ? pause() : play()}
        />
      </div>

      <ChartPanel
        open={panelOpen}
        bubbleData={bubbleData}
        illegalData={illegalData}
        timeSeriesData={timeSeriesData}
      />
    </div>
  )
}
