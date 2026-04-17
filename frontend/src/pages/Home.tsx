import { useEffect, useMemo, useRef, useState } from 'react'
import type { MapViewState } from '@deck.gl/core'
import type { Map as MaplibreMap } from 'maplibre-gl'

import MapView from '../components/Map'
import ZonePin from '../components/ZonePin'
import ZoneInfoPanel from '../components/ZoneInfoPanel'
import ChartSlot, { COMPACT_SCALE } from '../components/charts/ChartSlot'
import BubbleChart from '../components/charts/BubbleChart'
import LollipopChart from '../components/charts/LollipopChart'
import HeatmapChart from '../components/charts/HeatmapChart'
import Timeline from '../components/Timeline'
import MapLegend from '../components/MapLegend'

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
    onViewStateChange, seek, play, pause,
  } = useMapState(INITIAL_DATE, INITIAL_VIEW)

  const [mapInstance, setMapInstance] = useState<MaplibreMap | null>(null)
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [showChart, setShowChart] = useState(false)
  const [lockedIndex, setLockedIndex] = useState<number | null>(null)

  const { bubbleData, illegalData, timeSeriesData } = useViewportCharts(containerRef, viewState, currentDate)

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
    setShowChart(true)
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
    <div style={{ width: '100%', height: '100svh', position: 'relative' }}>
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

      <MapView
        data={data}
        viewState={viewState}
        resolution={resolution}
        containerRef={containerRef}
        onViewStateChange={onViewStateChange}
        locked={isPlaying}
        onMapInstance={setMapInstance}
      />

      {mapInstance && viewState.zoom < 5.5 && ZONES.map(zone => {
        const px = mapInstance.project([zone.lon, zone.lat])
        return (
          <div key={zone.id} style={{ position: 'absolute', left: px.x, top: px.y, zIndex: 30, pointerEvents: 'auto' }}>
            <ZonePin zone={zone} isSelected={selectedZone?.id === zone.id} onZoneClick={handleZoneClick} />
          </div>
        )
      })}

      {selectedZone && (
        <ZoneInfoPanel zone={selectedZone} onClose={() => setSelectedZone(null)} />
      )}

      {showChart && (
        <div style={{
          position: 'absolute', top: '50%', right: 20,
          transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap: 12,
          overflow: 'visible', pointerEvents: 'none', zIndex: 15,
        }}>
          <ChartSlot naturalHeight={340} locked={lockedIndex === 0} onToggleLock={() => setLockedIndex(p => p === 0 ? null : 0)}>
            <BubbleChart data={bubbleData} />
          </ChartSlot>
          <ChartSlot naturalHeight={252} locked={lockedIndex === 1} onToggleLock={() => setLockedIndex(p => p === 1 ? null : 1)}>
            <LollipopChart data={illegalData} />
          </ChartSlot>
          <ChartSlot naturalHeight={247} expandOffset={-Math.round(247 * (1 - COMPACT_SCALE))} locked={lockedIndex === 2} onToggleLock={() => setLockedIndex(p => p === 2 ? null : 2)}>
            <HeatmapChart data={timeSeriesData} />
          </ChartSlot>
        </div>
      )}

      <MapLegend maxHours={maxHours} />

      {/* Toggle charts button */}
      <button
        onClick={() => setShowChart(prev => !prev)}
        title={showChart ? 'Hide charts' : 'Show charts'}
        style={{
          position: 'absolute', top: 20, right: 20,
          width: 44, height: 44,
          background: 'rgba(10,14,18,0.6)', color: 'white',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 20,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <rect x="1"  y="10" width="4" height="7" rx="1" opacity={showChart ? 1 : 0.5} />
          <rect x="7"  y="5"  width="4" height="12" rx="1" opacity={showChart ? 1 : 0.5} />
          <rect x="13" y="1"  width="4" height="16" rx="1" opacity={showChart ? 1 : 0.5} />
        </svg>
      </button>

      {/* Timeline */}
      <Timeline
        currentDate={currentDate}
        isPlaying={isPlaying}
        onSeek={seek}
        onPlayPause={() => isPlaying ? pause() : play()}
      />
    </div>
  )
}
