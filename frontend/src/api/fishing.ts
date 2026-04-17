import { getConnection } from '../db'
import { queryDaily, queryRange, queryChart, queryTimeSeries } from '../db/queries'
import metaJson from '../data/meta.json'

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

export interface ChartItem {
  label: string
  value: number
}

export interface IllegalChartItem {
  label: string
  illegal_count: number
  total_count: number
  value: number
}

export interface TimeSeriesItem {
  year: number
  month: number
  vessel_count: number
}

export async function fetchFishingDaily(
  date: string,
  resolution: number,
  flag?: string,
  geartype?: string,
  bbox?: BBox,
): Promise<FishingCell[]> {
  const conn = await getConnection()
  return queryDaily(conn, date, resolution, flag, geartype, bbox)
}

export async function fetchFishingRange(
  dateStart: string,
  dateEnd: string,
  resolution: number,
  flag?: string,
  geartype?: string,
  bbox?: BBox,
): Promise<Map<string, FishingCell[]>> {
  const conn = await getConnection()
  return queryRange(conn, dateStart, dateEnd, resolution, flag, geartype, bbox)
}

export function fetchFishingMeta(): Promise<FishingMeta> {
  return Promise.resolve(metaJson as FishingMeta)
}

export async function fetchFishingChart(
  date: string,
  bbox: BBox,
  signal?: AbortSignal,
): Promise<{ data: ChartItem[] }> {
  if (signal?.aborted) return { data: [] }
  const conn = await getConnection()
  const data = await queryChart(conn, date, bbox)
  return { data }
}

export function fetchIllegalFishingChart(
  _date: string,
  _bbox: BBox,
  _signal?: AbortSignal,
): Promise<{ data: IllegalChartItem[] }> {
  // No daily_with_eez data available — stub
  return Promise.resolve({ data: [] })
}

export async function fetchTimeSeriesChart(
  bbox: BBox,
  signal?: AbortSignal,
): Promise<{ data: TimeSeriesItem[] }> {
  if (signal?.aborted) return { data: [] }
  const conn = await getConnection()
  const data = await queryTimeSeries(conn, bbox)
  return { data }
}
