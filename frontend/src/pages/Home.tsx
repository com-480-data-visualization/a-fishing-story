import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlyToInterpolator } from '@deck.gl/core'
import type { MapViewState } from '@deck.gl/core'
import type { Map as MaplibreMap } from 'maplibre-gl'

import MapView from '../components/Map'
import ZonePin from '../components/ZonePin'
import ChartPanel from '../components/ChartPanel'
import Timeline from '../components/Timeline'
import ZoneTimeline from '../components/ZoneTimeline'
import MapLegend from '../components/MapLegend'
import MapControls from '../components/MapControls'
import FlagPicker from '../components/FlagPicker'

import { ZONES } from '../data/zones'
import type { Zone } from '../data/zones'
import { useMapState } from '../hooks/useMapState'
import { useViewportCharts } from '../hooks/useViewportCharts'
import { useZoneTimelapse } from '../hooks/useZoneTimelapse'
import { useZoneCharts } from '../hooks/useZoneCharts'
import { zoomToResolution } from '../utils'
import { TIMELAPSE_YEAR } from '../constants'
import { theme } from '../theme'

const INITIAL_DATE = '2023-01-01'
const INITIAL_VIEW = { longitude: 10, latitude: 32.44, zoom: 1.4 }

/** Camera fly-in duration when entering a zone. */
const FLY_DURATION_MS = 1400

export default function Home() {
  const {
    data, viewState, resolution, containerRef,
    currentDate,
    selectedFlags, toggleFlag, clearFlags,
    onViewStateChange, seek,
  } = useMapState(INITIAL_DATE, INITIAL_VIEW)

  const [mapInstance, setMapInstance] = useState<MaplibreMap | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [showEEZ, setShowEEZ] = useState(false)
  const [flagPickerOpen, setFlagPickerOpen] = useState(false)

  // When set, the app is in zone-timelapse mode: a fixed-view, in-memory
  // year-long animation of one zone instead of the free-exploration map.
  const [timelapseZone, setTimelapseZone] = useState<Zone | null>(null)
  const inZoneMode = timelapseZone !== null

  // Camera state for zone mode — set with a fly-to transition on entry.
  const [zoneView, setZoneView] = useState<MapViewState | null>(null)
  const [zoneFlying, setZoneFlying] = useState(false)

  const tl = useZoneTimelapse(timelapseZone?.id ?? null, TIMELAPSE_YEAR, selectedFlags)
  const zoneCharts = useZoneCharts(tl.data)

  // Bumped whenever the map container resizes so viewport-scoped charts refetch.
  const [resizeNonce, setResizeNonce] = useState(0)
  const handleMapResize = useCallback(() => setResizeNonce(n => n + 1), [])

  const exploreCharts = useViewportCharts(containerRef, viewState, currentDate, resizeNonce)
  const charts = inZoneMode ? zoneCharts : exploreCharts

  // The grid currently rendered — a live viewport query, or a timelapse frame.
  const mapData = inZoneMode ? tl.frameData : data

  // In zone mode the camera is pinned to the zone (after the fly-in).
  const mapViewState: MapViewState = inZoneMode
    ? (zoneView ?? { longitude: timelapseZone.lon, latitude: timelapseZone.lat, zoom: timelapseZone.zoom })
    : viewState
  const mapResolution = inZoneMode ? zoomToResolution(timelapseZone.zoom) : resolution

  const maxHours = useMemo(() => {
    let max = 0
    for (const cells of mapData.values())
      for (const cell of cells)
        if (cell.fishing_hours > max) max = cell.fishing_hours
    return max
  }, [mapData])

  // Clicking a zone pin enters its timelapse, flying the camera in.
  const handleZoneClick = (zone: Zone) => {
    setTimelapseZone(zone)
    setPanelOpen(true)
    setZoneView({
      longitude: zone.lon,
      latitude: zone.lat,
      zoom: zone.zoom,
      transitionDuration: FLY_DURATION_MS,
      transitionInterpolator: new FlyToInterpolator(),
    } as MapViewState)
    setZoneFlying(true)
    window.setTimeout(() => setZoneFlying(false), FLY_DURATION_MS + 100)
  }

  const handleExitZone = () => {
    setTimelapseZone(null)
    setZoneView(null)
    setZoneFlying(false)
  }

  // Spacebar toggles zone-timelapse playback (explore mode has no playback).
  useEffect(() => {
    if (!inZoneMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      e.preventDefault()
      if (tl.isPlaying) tl.pause()
      else tl.play()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inZoneMode, tl.isPlaying, tl.play, tl.pause])

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
          data={mapData}
          viewState={mapViewState}
          resolution={mapResolution}
          containerRef={containerRef}
          // While flying in, feed transition frames back; once pinned, ignore.
          onViewStateChange={inZoneMode ? vs => setZoneView(vs) : onViewStateChange}
          locked={inZoneMode && !zoneFlying}
          onMapInstance={setMapInstance}
          onResize={handleMapResize}
          showEEZ={showEEZ}
        />

        {/* Zone pins — explore mode only */}
        {!inZoneMode && mapInstance && viewState.zoom < 5.5 && ZONES.map(zone => {
          const px = mapInstance.project([zone.lon, zone.lat])
          return (
            <div key={zone.id} style={{ position: 'absolute', left: px.x, top: px.y, zIndex: 10, pointerEvents: 'auto' }}>
              <ZonePin zone={zone} isSelected={false} onZoneClick={handleZoneClick} />
            </div>
          )
        })}

        {/* Loading overlay while a zone's year is being fetched */}
        {inZoneMode && tl.loading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(15,23,42,0.18)',
            backdropFilter: 'blur(2px)',
            color: theme.textPrimary, fontSize: 14, fontWeight: 600,
            pointerEvents: 'none',
          }}>
            Loading {timelapseZone.name} timelapse…
          </div>
        )}

        <MapLegend maxHours={maxHours} selectedFlags={selectedFlags} />

        <MapControls
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen(prev => !prev)}
          flagActive={selectedFlags.length > 0}
          flagPickerOpen={flagPickerOpen}
          onToggleFlagPicker={() => setFlagPickerOpen(prev => !prev)}
          showEEZ={showEEZ}
          onToggleEEZ={() => setShowEEZ(prev => !prev)}
        />

        <FlagPicker
          key={flagPickerOpen ? 'open' : 'closed'}
          selectedFlags={selectedFlags}
          onToggle={toggleFlag}
          onClear={clearFlags}
          open={flagPickerOpen}
        />

        {inZoneMode ? (
          <ZoneTimeline
            dates={tl.data?.dates ?? []}
            index={tl.index}
            isPlaying={tl.isPlaying}
            onSeek={tl.seek}
            onPlayPause={() => tl.isPlaying ? tl.pause() : tl.play()}
            onExit={handleExitZone}
          />
        ) : (
          <Timeline currentDate={currentDate} onSeek={seek} />
        )}
      </div>

      <ChartPanel
        open={panelOpen}
        bubbleData={charts.bubbleData}
        illegalData={charts.illegalData}
        timeSeriesData={charts.timeSeriesData}
        zone={inZoneMode ? timelapseZone : null}
      />
    </div>
  )
}
