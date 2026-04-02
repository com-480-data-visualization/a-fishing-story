import { useMemo } from 'react'
import type { RefObject } from 'react'
import DeckGL from '@deck.gl/react'
import { SolidPolygonLayer } from '@deck.gl/layers'
import type { MapViewState } from '@deck.gl/core'
import ReactMapGL from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

import type { FishingCell } from '../api/fishing'
import { fishingColor, flagColor } from '../utils'

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

const TAIWAN_BOUNDS = {
  minLon: 110.0,
  maxLon: 127.5,
  minLat: 8.0,
  maxLat: 29.0,
}

interface MapViewProps {
  data: Map<string, FishingCell[]>
  viewState: MapViewState
  resolution: number
  containerRef: RefObject<HTMLDivElement | null>
  onViewStateChange: (vs: MapViewState) => void
  locked?: boolean
  onSouthChinaSeaClick?: () => void
}

export default function MapView({
  data,
  viewState,
  resolution,
  containerRef,
  onViewStateChange,
  locked,
  onSouthChinaSeaClick,
}: MapViewProps) {
  const res = resolution

  const layers = useMemo(() => {
    const entries = Array.from(data.entries())
    const isMultiFlag = entries.length > 1 || (entries.length === 1 && entries[0][0] !== '')

    const taiwanLayer = new SolidPolygonLayer({
      id: 'taiwan-rectangle',
      data: [
        {
          polygon: [
            [TAIWAN_BOUNDS.minLon, TAIWAN_BOUNDS.minLat],
            [TAIWAN_BOUNDS.maxLon, TAIWAN_BOUNDS.minLat],
            [TAIWAN_BOUNDS.maxLon, TAIWAN_BOUNDS.maxLat],
            [TAIWAN_BOUNDS.minLon, TAIWAN_BOUNDS.maxLat],
          ],
        },
      ],
      getPolygon: d => d.polygon,
      getFillColor: [255, 140, 0, 35],
      getLineColor: [255, 170, 0, 255],
      getLineWidth: 4,
      stroked: true,
      filled: true,
      pickable: true,
    })

    const fishingLayers = entries.map(([flag, cells], index) => {
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

    const showTaiwanLayer = viewState.zoom < 4.5

    return showTaiwanLayer ? [taiwanLayer, ...fishingLayers] : fishingLayers
  }, [data, res, viewState.zoom])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) => onViewStateChange(vs as MapViewState)}
        onClick={(info) => {
          if (info.layer?.id === 'taiwan-rectangle') {
            onSouthChinaSeaClick?.()
            onViewStateChange({
              ...viewState,
              longitude: 118.75,
              latitude: 18.5,
              zoom: 5,
              transitionDuration: 1200,
            } as MapViewState)
            
          }
        }}
        controller={!locked}
        layers={layers}
      >
        <ReactMapGL mapStyle={MAP_STYLE} />
      </DeckGL>
    </div>
  )
}