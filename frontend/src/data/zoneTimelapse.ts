import { getConnection, DATA_BASE_URL } from '../db'

/** One aggregated grid cell for a single day of a zone timelapse. */
export interface ZoneCell {
  lat: number
  lon: number
  flag: string
  fishing_hours: number
  illegal_hours: number
}

/**
 * A full year of a zone's fishing activity, precomputed by
 * `notebooks/zone_timelapse.ipynb` and loaded once into memory. The timelapse
 * then plays entirely client-side — no per-frame network.
 */
export interface ZoneTimelapseData {
  zoneId: string
  year: number
  /** Sorted ascending — the timelapse frame order. */
  dates: string[]
  /** date → cells active that day. */
  framesByDate: Map<string, ZoneCell[]>
  /** Flat list of every cell across the year — for whole-year chart aggregation. */
  rows: ZoneCell[]
}

function zoneUrl(zoneId: string, year: number): string {
  return `${DATA_BASE_URL}/zones/${zoneId}-${year}.parquet`
}

/**
 * Fetches and parses one zone-year parquet. A single DuckDB query reads the
 * whole (small) file; everything after this is in-memory.
 */
export async function loadZoneTimelapse(zoneId: string, year: number): Promise<ZoneTimelapseData> {
  const conn = await getConnection()
  const url = zoneUrl(zoneId, year)

  const table = await conn.query(`
    SELECT date, lat, lon, flag, fishing_hours, illegal_hours
    FROM read_parquet('${url}')
    ORDER BY date
  `)

  const dateCol    = table.getChild('date')!
  const latCol     = table.getChild('lat')!
  const lonCol     = table.getChild('lon')!
  const flagCol    = table.getChild('flag')!
  const hoursCol   = table.getChild('fishing_hours')!
  const illegalCol = table.getChild('illegal_hours')!

  const framesByDate = new Map<string, ZoneCell[]>()
  const rows: ZoneCell[] = []

  // The row count is large (~1M+); building the index in one pass would block
  // the main thread and freeze the zone fly-in. Process it in chunks, yielding
  // to the event loop between each so animations keep running.
  const total = table.numRows
  const CHUNK = 10_000
  for (let start = 0; start < total; start += CHUNK) {
    const end = Math.min(start + CHUNK, total)
    for (let i = start; i < end; i++) {
      const date = String(dateCol.get(i))
      const cell: ZoneCell = {
        lat:           latCol.get(i) as number,
        lon:           lonCol.get(i) as number,
        flag:          String(flagCol.get(i)),
        fishing_hours: hoursCol.get(i) as number,
        illegal_hours: illegalCol.get(i) as number,
      }
      rows.push(cell)
      let frame = framesByDate.get(date)
      if (!frame) { frame = []; framesByDate.set(date, frame) }
      frame.push(cell)
    }
    if (end < total) await new Promise(resolve => setTimeout(resolve, 0))
  }

  const dates = Array.from(framesByDate.keys()).sort()
  return { zoneId, year, dates, framesByDate, rows }
}
