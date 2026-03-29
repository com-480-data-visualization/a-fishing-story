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

interface MapViewProps {
  data: Map<string, FishingCell[]>
  viewState: MapViewState
  resolution: number
  containerRef: RefObject<HTMLDivElement | null>
  onViewStateChange: (vs: MapViewState) => void
  locked?: boolean
}

export default function MapView({ data, viewState, resolution, containerRef, onViewStateChange, locked }: MapViewProps) {
  const res = resolution

  const layers = useMemo(() => {
    const entries = Array.from(data.entries())
    const isMultiFlag = entries.length > 1 || (entries.length === 1 && entries[0][0] !== '')

    return entries.map(([flag, cells], index) => {
      const maxHours = cells.reduce((max, d) => Math.max(max, d.fishing_hours), 1)

      return new SolidPolygonLayer<FishingCell>({
        id: `fishing-grid-${flag || 'global'}`,
        data: cells,
        getPolygon: d => [
          [d.lon,       d.lat      ],
          [d.lon + res, d.lat      ],
          [d.lon + res, d.lat + res],
          [d.lon,       d.lat + res],
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
        <ReactMapGL mapStyle={MAP_STYLE} />
      </DeckGL>
    </div>
  )
}
