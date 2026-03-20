import { tableFromIPC } from 'apache-arrow'
import { api } from './client'

export interface FishingCell {
  lat: number
  lon: number
  fishing_hours: number
}

export interface FishingMeta {
  date_min: string
  date_max: string
  flags: string[]
  geartypes: string[]
}

export interface BBox {
  lat_min: number
  lat_max: number
  lon_min: number
  lon_max: number
}

export async function fetchFishingDaily(
  date: string,
  resolution: number,
  flag?: string,
  geartype?: string,
  bbox?: BBox,
): Promise<FishingCell[]> {
  const params = new URLSearchParams({ date, resolution: String(resolution) })
  if (flag) params.set('flag', flag)
  if (geartype) params.set('geartype', geartype)
  if (bbox) {
    params.set('lat_min', String(bbox.lat_min))
    params.set('lat_max', String(bbox.lat_max))
    params.set('lon_min', String(bbox.lon_min))
    params.set('lon_max', String(bbox.lon_max))
  }

  const response = await api.getRaw(`/api/fishing/daily?${params}`)
  const buffer = await response.arrayBuffer()
  const table = tableFromIPC(buffer)

  const latCol = table.getChild('lat')!
  const lonCol = table.getChild('lon')!
  const hoursCol = table.getChild('fishing_hours')!

  const cells: FishingCell[] = []
  for (let i = 0; i < table.numRows; i++) {
    cells.push({
      lat: latCol.get(i) as number,
      lon: lonCol.get(i) as number,
      fishing_hours: hoursCol.get(i) as number,
    })
  }
  return cells
}

export async function fetchFishingRange(
  dateStart: string,
  dateEnd: string,
  resolution: number,
  flag?: string,
  geartype?: string,
  bbox?: BBox,
): Promise<Map<string, FishingCell[]>> {
  const params = new URLSearchParams({ date_start: dateStart, date_end: dateEnd, resolution: String(resolution) })
  if (flag) params.set('flag', flag)
  if (geartype) params.set('geartype', geartype)
  if (bbox) {
    params.set('lat_min', String(bbox.lat_min))
    params.set('lat_max', String(bbox.lat_max))
    params.set('lon_min', String(bbox.lon_min))
    params.set('lon_max', String(bbox.lon_max))
  }

  const response = await api.getRaw(`/api/fishing/daily/range?${params}`)
  const buffer = await response.arrayBuffer()
  const table = tableFromIPC(buffer)

  const dateCol = table.getChild('date')!
  const latCol = table.getChild('lat')!
  const lonCol = table.getChild('lon')!
  const hoursCol = table.getChild('fishing_hours')!

  const result = new Map<string, FishingCell[]>()
  for (let i = 0; i < table.numRows; i++) {
    const dateStr = dateCol.get(i) as string
    if (!result.has(dateStr)) result.set(dateStr, [])
    result.get(dateStr)!.push({
      lat: latCol.get(i) as number,
      lon: lonCol.get(i) as number,
      fishing_hours: hoursCol.get(i) as number,
    })
  }
  return result
}

export function fetchFishingMeta(): Promise<FishingMeta> {
  return api.get<FishingMeta>('/api/fishing/meta')
}
