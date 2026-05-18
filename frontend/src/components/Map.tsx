import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import DeckGL from '@deck.gl/react'
import { SolidPolygonLayer } from '@deck.gl/layers'
import type { MapViewState } from '@deck.gl/core'
import ReactMapGL from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Map as MaplibreMap } from 'maplibre-gl'

import type { FishingCell } from '../api/fishing'
import { fishingColor, flagColor } from '../utils'
import { DATA_BASE_URL } from '../db/index'

const MAP_STYLE = 'https://tiles.stadiamaps.com/styles/outdoors.json'

interface MapViewProps {
  data: Map<string, FishingCell[]>
  viewState: MapViewState
  resolution: number
  containerRef: RefObject<HTMLDivElement | null>
  onViewStateChange: (vs: MapViewState) => void
  locked?: boolean
  onMapInstance?: (map: MaplibreMap) => void
  onResize?: () => void
  showEEZ?: boolean
}

export default function MapView({
  data,
  viewState,
  resolution,
  containerRef,
  onViewStateChange,
  locked,
  onMapInstance,
  onResize,
  showEEZ = false,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const eezReadyRef = useRef(false)
  const showEEZRef = useRef(showEEZ)
  const res = resolution

  useEffect(() => {
    // Mirror into a ref so the map's onLoad handler can read the latest value.
    showEEZRef.current = showEEZ
    const map = mapRef.current?.getMap()
    if (!map || !eezReadyRef.current) return
    map.setLayoutProperty('eez-lines', 'visibility', showEEZ ? 'visible' : 'none')
  }, [showEEZ])

  // Keep MapLibre in sync when the container resizes (e.g. the chart panel
  // pushing the map area), and notify the parent so viewport-scoped data refetches.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      mapRef.current?.getMap()?.resize()
      onResize?.()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef, onResize])

  const layers = useMemo(() => {
    const entries = Array.from(data.entries())
    const isMultiFlag = entries.length > 1

    return entries.map(([flag, cells], index) => {
      const maxHours = cells.reduce((max, d) => Math.max(max, d.fishing_hours), 1)

      return new SolidPolygonLayer<FishingCell>({
        id: `fishing-grid-${flag || 'global'}`,
        data: cells,
        getPolygon: d => [
          [d.lon, d.lat],
          [d.lon + res, d.lat],
          [d.lon + res, d.lat + res],
          [d.lon, d.lat + res],
        ],
        getFillColor: isMultiFlag
          ? d => flagColor(index, d.fishing_hours, maxHours)
          : d => fishingColor(d.fishing_hours, maxHours),
        extruded: false,
        pickable: false,
      })
    })
  }, [data, res])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) => onViewStateChange(vs as MapViewState)}
        controller={!locked}
        layers={layers}
      >
        <ReactMapGL
          ref={mapRef}
          mapStyle={MAP_STYLE}
          onLoad={() => {
            const map = mapRef.current?.getMap()
            if (!map) return
            map.addSource('eez-boundaries', {
              type: 'geojson',
              data: `${DATA_BASE_URL}/eez_boundaries.geojson`,
            })
            map.addLayer({
              id: 'eez-lines',
              type: 'line',
              source: 'eez-boundaries',
              layout: { visibility: 'none' },
              paint: {
                'line-color': 'rgba(12, 203, 194, 0.75)',
                'line-width': 1.5,
              },
            })
            eezReadyRef.current = true
            if (showEEZRef.current) {
              map.setLayoutProperty('eez-lines', 'visibility', 'visible')
            }
            if (onMapInstance) onMapInstance(map)
          }}
        />
      </DeckGL>
    </div>
  )
}
