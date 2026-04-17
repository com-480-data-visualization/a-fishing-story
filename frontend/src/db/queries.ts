import * as duckdb from '@duckdb/duckdb-wasm'
import type { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm'
import type { FishingCell, BBox, ChartItem, TimeSeriesItem } from '../api/fishing'
import { DATA_BASE_URL, getDB, resolveDirectUrl } from './index'

// Maps logical name → resolved direct URL already registered with DuckDB.
const registered = new Map<string, string>()

async function registerParquet(name: string, logicalUrl: string): Promise<void> {
  const directUrl = await resolveDirectUrl(logicalUrl)

  // Re-register if the direct URL changed (signed URL refreshed).
  if (registered.get(name) === directUrl) return

  const db = await getDB()
  await db.registerFileURL(name, directUrl, duckdb.DuckDBDataProtocol.HTTP, false)
  registered.set(name, directUrl)
}

function monthName(yearMonth: string): string {
  return `fleet-daily-${yearMonth}.parquet`
}

function monthUrl(yearMonth: string): string {
  return `${DATA_BASE_URL}/daily_sorted/fleet-daily-${yearMonth}.parquet`
}

export async function queryDaily(
  conn: AsyncDuckDBConnection,
  date: string,
  resolution: number,
  flag?: string,
  geartype?: string,
  bbox?: BBox,
): Promise<FishingCell[]> {
  const yearMonth = date.slice(0, 7)
  const name = monthName(yearMonth)
  await registerParquet(name, monthUrl(yearMonth))

  const res = resolution
  const conditions: string[] = [`date = '${date}'`]
  if (bbox) {
    conditions.push(`cell_ll_lat BETWEEN ${bbox.lat_min} AND ${bbox.lat_max}`)
    conditions.push(`cell_ll_lon BETWEEN ${bbox.lon_min} AND ${bbox.lon_max}`)
  }
  if (flag) conditions.push(`flag = '${flag}'`)
  if (geartype) conditions.push(`geartype = '${geartype}'`)

  const table = await conn.query(`
    SELECT
      (ROUND(cell_ll_lat / ${res}) * ${res})::FLOAT AS lat,
      (ROUND(cell_ll_lon / ${res}) * ${res})::FLOAT AS lon,
      SUM(fishing_hours)::FLOAT AS fishing_hours
    FROM read_parquet('${name}')
    WHERE ${conditions.join(' AND ')}
    GROUP BY lat, lon
  `)

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

export async function queryRange(
  conn: AsyncDuckDBConnection,
  dateStart: string,
  dateEnd: string,
  resolution: number,
  flag?: string,
  geartype?: string,
  bbox?: BBox,
): Promise<Map<string, FishingCell[]>> {
  const res = resolution

  const yearMonths: string[] = []
  const cur = new Date(dateStart)
  cur.setDate(1)
  const end = new Date(dateEnd)
  while (cur <= end) {
    yearMonths.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`)
    cur.setMonth(cur.getMonth() + 1)
  }
  if (yearMonths.length === 0) return new Map()

  await Promise.all(yearMonths.map(ym => registerParquet(monthName(ym), monthUrl(ym))))

  const namesList = '[' + yearMonths.map(ym => `'${monthName(ym)}'`).join(', ') + ']'
  const conditions: string[] = [
    `date BETWEEN '${dateStart}' AND '${dateEnd}'`,
    `cell_ll_lat BETWEEN ${bbox?.lat_min ?? -90} AND ${bbox?.lat_max ?? 90}`,
    `cell_ll_lon BETWEEN ${bbox?.lon_min ?? -180} AND ${bbox?.lon_max ?? 180}`,
  ]
  if (flag) conditions.push(`flag = '${flag}'`)
  if (geartype) conditions.push(`geartype = '${geartype}'`)

  const table = await conn.query(`
    SELECT
      date::VARCHAR AS date,
      (ROUND(cell_ll_lat / ${res}) * ${res})::FLOAT AS lat,
      (ROUND(cell_ll_lon / ${res}) * ${res})::FLOAT AS lon,
      SUM(fishing_hours)::FLOAT AS fishing_hours
    FROM read_parquet(${namesList})
    WHERE ${conditions.join(' AND ')}
    GROUP BY date, lat, lon
    ORDER BY date
  `)

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

export async function queryChart(
  conn: AsyncDuckDBConnection,
  date: string,
  bbox: BBox,
): Promise<ChartItem[]> {
  const yearMonth = date.slice(0, 7)
  const name = monthName(yearMonth)
  await registerParquet(name, monthUrl(yearMonth))

  const table = await conn.query(`
    SELECT
      flag AS label,
      SUM(mmsi_present)::DOUBLE AS value
    FROM read_parquet('${name}')
    WHERE date = '${date}'
      AND cell_ll_lon BETWEEN ${bbox.lon_min} AND ${bbox.lon_max}
      AND cell_ll_lat BETWEEN ${bbox.lat_min} AND ${bbox.lat_max}
      AND flag IS NOT NULL
    GROUP BY flag
    HAVING SUM(mmsi_present) > 0
    ORDER BY value DESC
  `)

  const rows = table.toArray()
  if (rows.length === 0) return []

  const total = rows.reduce((sum, r) => sum + Number(r.value), 0)
  return rows.map(r => ({
    label: String(r.label),
    value: Math.round(100.0 * Number(r.value) / total * 100) / 100,
  }))
}

export async function queryTimeSeries(
  conn: AsyncDuckDBConnection,
  bbox: BBox,
): Promise<TimeSeriesItem[]> {
  const name = 'timeseries_grid.parquet'
  await registerParquet(name, `${DATA_BASE_URL}/timeseries_grid.parquet`)

  const table = await conn.query(`
    SELECT
      year::INTEGER  AS year,
      month::INTEGER AS month,
      SUM(vessel_count)::BIGINT AS vessel_count
    FROM read_parquet('${name}')
    WHERE cell_ll_lon BETWEEN ${bbox.lon_min} AND ${bbox.lon_max}
      AND cell_ll_lat BETWEEN ${bbox.lat_min} AND ${bbox.lat_max}
    GROUP BY year, month
    ORDER BY year, month
  `)

  return table.toArray().map(r => ({
    year: Number(r.year),
    month: Number(r.month),
    vessel_count: Number(r.vessel_count),
  }))
}
