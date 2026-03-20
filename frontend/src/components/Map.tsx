import { useMemo } from 'react'
import type { RefObject } from 'react'
import DeckGL from '@deck.gl/react'
import { SolidPolygonLayer } from '@deck.gl/layers'
import type { MapViewState } from '@deck.gl/core'
import ReactMapGL from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

import type { FishingCell } from '../api/fishing'
import { fishingColor } from '../utils'

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

interface MapViewProps {
  data: FishingCell[]
  viewState: MapViewState
  resolution: number
  containerRef: RefObject<HTMLDivElement | null>
  onViewStateChange: (vs: MapViewState) => void
  locked?: boolean
}

export default function MapView({ data, viewState, resolution, containerRef, onViewStateChange, locked }: MapViewProps) {
  const maxHours = useMemo(
    () => data.reduce((max, d) => Math.max(max, d.fishing_hours), 1),
    [data],
  )

  const res = resolution

  const layer = useMemo(
    () =>
      new SolidPolygonLayer<FishingCell>({
        id: 'fishing-grid',
        data,
        getPolygon: d => [
          [d.lon,       d.lat      ],
          [d.lon + res, d.lat      ],
          [d.lon + res, d.lat + res],
          [d.lon,       d.lat + res],
        ],
        getFillColor: d => fishingColor(d.fishing_hours, maxHours),
        extruded: false,
        pickable: false,
      }),
    [data, maxHours, res],
  )

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) => onViewStateChange(vs as MapViewState)}
        controller={!locked}
        layers={[layer]}
      >
        <ReactMapGL mapStyle={MAP_STYLE} />
      </DeckGL>
    </div>
  )
}
