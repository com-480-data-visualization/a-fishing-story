import { useMemo } from 'react'
import type { ZoneTimelapseData } from '../data/zoneTimelapse'
import type { BarItem } from '../components/charts/BarChart'
import type { IllegalItem } from '../components/charts/IllegalFishingChart'
import type { TimeSeriesPoint } from '../components/charts/HeatmapChart'

/** Minimum illegal hours for a flag to appear in the illegal-fishing chart. */
const ILLEGAL_MIN_HOURS = 10
const ILLEGAL_MAX_ROWS = 5

interface ZoneCharts {
  bubbleData: BarItem[]
  illegalData: IllegalItem[]
  timeSeriesData: TimeSeriesPoint[]
}

const EMPTY: ZoneCharts = { bubbleData: [], illegalData: [], timeSeriesData: [] }

/**
 * Computes all three charts for a zone from its in-memory yearly data — no
 * queries. Charts cover the whole year, so they are static during playback.
 * Mirrors the SQL in `src/db/queries.ts` (queryChart / queryIllegalFishing).
 */
export function useZoneCharts(data: ZoneTimelapseData | null): ZoneCharts {
  return useMemo<ZoneCharts>(() => {
    if (!data || data.rows.length === 0) return EMPTY

    // Per-flag totals across the year.
    const totalByFlag = new Map<string, number>()
    const illegalByFlag = new Map<string, number>()
    // Per-month fishing hours.
    const hoursByMonth = new Map<number, number>()

    for (const c of data.rows) {
      totalByFlag.set(c.flag, (totalByFlag.get(c.flag) ?? 0) + c.fishing_hours)
      if (c.illegal_hours > 0)
        illegalByFlag.set(c.flag, (illegalByFlag.get(c.flag) ?? 0) + c.illegal_hours)
    }
    for (const [date, cells] of data.framesByDate) {
      const month = Number(date.slice(5, 7))
      let sum = 0
      for (const c of cells) sum += c.fishing_hours
      hoursByMonth.set(month, (hoursByMonth.get(month) ?? 0) + sum)
    }

    // Bubble — share of total fishing hours by flag. BarChart trims to top N.
    const grandTotal = [...totalByFlag.values()].reduce((s, v) => s + v, 0)
    const bubbleData: BarItem[] = grandTotal === 0 ? [] :
      [...totalByFlag.entries()]
        .map(([label, v]) => ({ label, value: Math.round((100 * v / grandTotal) * 100) / 100 }))
        .sort((a, b) => b.value - a.value)

    // Illegal — top flags by foreign-EEZ fishing hours.
    const illegalData: IllegalItem[] = [...illegalByFlag.entries()]
      .filter(([, illegal]) => illegal >= ILLEGAL_MIN_HOURS)
      .map(([label, illegal]) => {
        const total = totalByFlag.get(label) ?? 0
        return {
          label,
          illegal_count: illegal,
          total_count: total,
          value: total > 0 ? Math.round((illegal / total) * 1000) / 10 : 0,
        }
      })
      .sort((a, b) => b.illegal_count - a.illegal_count)
      .slice(0, ILLEGAL_MAX_ROWS)

    // Time series — monthly fishing hours for the timelapse year. The heatmap's
    // `vessel_count` field is reused as the generic per-month magnitude.
    const timeSeriesData: TimeSeriesPoint[] = [...hoursByMonth.entries()]
      .map(([month, hours]) => ({ year: data.year, month, vessel_count: Math.round(hours) }))
      .sort((a, b) => a.month - b.month)

    return { bubbleData, illegalData, timeSeriesData }
  }, [data])
}
