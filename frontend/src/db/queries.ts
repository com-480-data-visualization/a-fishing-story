import type { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm'
import type { FishingCell, BBox, ChartItem, IllegalChartItem, TimeSeriesItem } from '../api/fishing'
import { DATA_BASE_URL } from './index'

function getDayUrl(date: string): string {
  return `${DATA_BASE_URL}/daily_split/fleet-daily-${date}.parquet`
}

export async function queryDaily(
  conn: AsyncDuckDBConnection,
  date: string,
  resolution: number,
  flag?: string,
  geartype?: string,
  bbox?: BBox,
): Promise<FishingCell[]> {
  const url = getDayUrl(date)
  const res = resolution
  const conditions: string[] = []
  if (bbox) {
    conditions.push(`cell_ll_lat BETWEEN ${bbox.lat_min} AND ${bbox.lat_max}`)
    conditions.push(`cell_ll_lon BETWEEN ${bbox.lon_min} AND ${bbox.lon_max}`)
  }
  if (flag) conditions.push(`flag = '${flag}'`)
  if (geartype) conditions.push(`geartype = '${geartype}'`)

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const table = await conn.query(`
    SELECT
      (ROUND(cell_ll_lat / ${res}) * ${res})::FLOAT AS lat,
      (ROUND(cell_ll_lon / ${res}) * ${res})::FLOAT AS lon,
      SUM(fishing_hours)::FLOAT AS fishing_hours
    FROM read_parquet('${url}')
    ${where}
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

export async function queryChart(
  conn: AsyncDuckDBConnection,
  date: string,
  bbox: BBox,
): Promise<ChartItem[]> {
  const url = getDayUrl(date)

  const table = await conn.query(`
    SELECT
      flag AS label,
      SUM(fishing_hours)::DOUBLE AS value
    FROM read_parquet('${url}')
    WHERE cell_ll_lon BETWEEN ${bbox.lon_min} AND ${bbox.lon_max}
      AND cell_ll_lat BETWEEN ${bbox.lat_min} AND ${bbox.lat_max}
      AND flag IS NOT NULL
    GROUP BY flag
    HAVING SUM(fishing_hours) > 0
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

export async function queryIllegalFishing(
  conn: AsyncDuckDBConnection,
  date: string,
  bbox: BBox,
): Promise<IllegalChartItem[]> {
  const dayUrl = getDayUrl(date)
  const eezUrl = `${DATA_BASE_URL}/eez_grid.parquet`

  const table = await conn.query(`
    SELECT
      d.flag,
      SUM(d.fishing_hours)::DOUBLE AS total_count,
      SUM(CASE WHEN e.eez_iso != d.flag AND e.eez_iso != 'INT'
               THEN d.fishing_hours ELSE 0 END)::DOUBLE AS illegal_count
    FROM read_parquet('${dayUrl}') d
    JOIN read_parquet('${eezUrl}') e
      ON ROUND(d.cell_ll_lat::DOUBLE * 10)::INTEGER = ROUND(e.cell_ll_lat * 10)::INTEGER
     AND ROUND(d.cell_ll_lon::DOUBLE * 10)::INTEGER = ROUND(e.cell_ll_lon * 10)::INTEGER
    WHERE d.cell_ll_lat BETWEEN ${bbox.lat_min} AND ${bbox.lat_max}
      AND d.cell_ll_lon BETWEEN ${bbox.lon_min} AND ${bbox.lon_max}
      AND d.flag IS NOT NULL
    GROUP BY d.flag
    HAVING illegal_count >= 10
    ORDER BY illegal_count DESC
    LIMIT 5
  `)

  return table.toArray().map(r => {
    const total   = Number(r.total_count)
    const illegal = Number(r.illegal_count)
    return {
      label:         String(r.flag),
      total_count:   total,
      illegal_count: illegal,
      value:         total > 0 ? Math.round(illegal / total * 1000) / 10 : 0,
    }
  })
}

export async function queryTimeSeries(
  conn: AsyncDuckDBConnection,
  bbox: BBox,
): Promise<TimeSeriesItem[]> {
  const url = `${DATA_BASE_URL}/timeseries_grid.parquet`

  const table = await conn.query(`
    SELECT
      year::INTEGER  AS year,
      month::INTEGER AS month,
      SUM(vessel_count)::BIGINT AS vessel_count
    FROM read_parquet('${url}')
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
