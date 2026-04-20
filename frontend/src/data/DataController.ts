import { DATA_BASE_URL } from '../db/index'
import { fetchFishingDaily } from '../api/fishing'
import type { FishingCell, BBox } from '../api/fishing'
import { nextDay, bboxExceedsFetched } from '../utils'
import { DATE_MAX } from '../constants'

const PREFETCH_DAYS = 5

export interface QueryContext {
  resolution: number
  flags: string[]
}

interface CacheEntry {
  status: 'loading' | 'ready'
  data: Map<string, FishingCell[]>
  fetchedBBox: BBox
}

type Listener = () => void

function dayUrl(date: string): string {
  return `${DATA_BASE_URL}/daily_split/fleet-daily-${date}.parquet`
}

function padBBox(bbox: BBox): BBox {
  const lonPad = (bbox.lon_max - bbox.lon_min) * 0.5
  const latPad = (bbox.lat_max - bbox.lat_min) * 0.5
  return {
    lon_min: Math.max(bbox.lon_min - lonPad, -180),
    lon_max: Math.min(bbox.lon_max + lonPad, 180),
    lat_min: Math.max(bbox.lat_min - latPad, -90),
    lat_max: Math.min(bbox.lat_max + latPad, 90),
  }
}

export class DataController {
  private cache = new Map<string, CacheEntry>()
  private prefetching = new Set<string>()
  private listeners = new Set<Listener>()
  readonly ctx: QueryContext

  constructor(ctx: QueryContext) {
    this.ctx = ctx
  }

  load(date: string, bbox: BBox): void {
    const entry = this.cache.get(date)

    // Already ready and bbox is covered — nothing to do
    if (entry?.status === 'ready' && !bboxExceedsFetched(bbox, entry.fetchedBBox)) return

    // In-flight with a bbox that still covers the request — wait for it
    if (entry?.status === 'loading' && !bboxExceedsFetched(bbox, entry.fetchedBBox)) return

    const paddedBBox = padBBox(bbox)
    const newEntry: CacheEntry = { status: 'loading', data: new Map(), fetchedBBox: paddedBBox }
    this.cache.set(date, newEntry)
    this.notify()

    const { resolution, flags } = this.ctx
    const flagsToFetch = flags.length > 0 ? flags : ['']

    Promise.all(
      flagsToFetch.map(flag =>
        fetchFishingDaily(date, resolution, flag || undefined, undefined, paddedBBox)
          .then(cells => [flag, cells] as [string, FishingCell[]])
      )
    ).then(entries => {
      // Discard if a newer load() call superseded this one
      if (this.cache.get(date) !== newEntry) return
      newEntry.status = 'ready'
      newEntry.data = new Map(entries)
      this.notify()
    })

    this.schedulePrefetch(date)
  }

  get(date: string): { data: Map<string, FishingCell[]>; loading: boolean } {
    const entry = this.cache.get(date)
    if (!entry) return { data: new Map(), loading: false }
    return { data: entry.data, loading: entry.status === 'loading' }
  }

  subscribe(cb: Listener): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  private notify(): void {
    this.listeners.forEach(cb => cb())
  }

  // Fires plain fetch() for the next N days to prime the browser HTTP cache.
  // DuckDB will then read from cache when those dates are actually queried.
  private schedulePrefetch(fromDate: string): void {
    let date = fromDate
    for (let i = 0; i < PREFETCH_DAYS; i++) {
      date = nextDay(date)
      if (date > DATE_MAX) break
      if (!this.prefetching.has(date) && !this.cache.has(date)) {
        this.prefetching.add(date)
        fetch(dayUrl(date)).finally(() => this.prefetching.delete(date))
      }
    }
  }
}
