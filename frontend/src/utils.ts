import { WebMercatorViewport, type MapViewState } from '@deck.gl/core'
import type { BBox } from './api/fishing'

/**
 * Maps a deck.gl zoom level to a data resolution (degrees).
 * Resolutions are powers of 2 starting from 0.01°, capped at 0.512°.
 */
export function zoomToResolution(zoom: number): number {
  if (zoom <= 2) return 0.512
  if (zoom <= 4) return 0.32
  if (zoom <= 5) return 0.16
  if (zoom <= 6) return 0.08
  if (zoom <= 7) return 0.04
  if (zoom <= 8) return 0.02
  return 0.01
}

/** Returns true if any edge of `current` extends beyond the `fetched` bbox. */
export function bboxExceedsFetched(current: BBox, fetched: BBox): boolean {
  return (
    current.lat_min < fetched.lat_min ||
    current.lat_max > fetched.lat_max ||
    current.lon_min < fetched.lon_min ||
    current.lon_max > fetched.lon_max
  )
}

export function fishingColor(value: number, max: number): [number, number, number, number] {
  const t = Math.min(value / max, 1)
  return [
    Math.round(t * 255),
    Math.round(t * 200),
    Math.round((1 - t) * 180),
    200,
  ]
}

const FLAG_COLORS: [number, number, number][] = [
  [220, 50,  50 ],  // red
  [50,  180, 220],  // cyan
  [50,  220, 100],  // green
  [220, 160, 50 ],  // orange
  [180, 50,  220],  // purple
]

export function flagColor(flagIndex: number, value: number, max: number): [number, number, number, number] {
  const t = Math.min(value / max, 1)
  const [r, g, b] = FLAG_COLORS[flagIndex % FLAG_COLORS.length]
  return [
    Math.round(r * t),
    Math.round(g * t),
    Math.round(b * t),
    Math.round(50 + t * 180),
  ]
}

export function nextDay(date: string): string {
  const d = new Date(date)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export function computeBBox(
  container: HTMLDivElement | null,
  viewState: MapViewState,
): BBox | undefined {
  if (!container) return undefined
  const { width, height } = container.getBoundingClientRect()
  if (!width || !height) return undefined
  const vp = new WebMercatorViewport({ width, height, ...viewState })
  const [lon_min, lat_min, lon_max, lat_max] = vp.getBounds()
  return {
    lat_min: Math.max(lat_min, -90),
    lat_max: Math.min(lat_max, 90),
    lon_min: Math.max(lon_min, -180),
    lon_max: Math.min(lon_max, 180),
  }
}
