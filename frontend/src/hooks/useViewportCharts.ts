import { useState, useEffect } from 'react'
import type { RefObject } from 'react'
import type { MapViewState } from '@deck.gl/core'
import { computeBBox } from '../utils'
import {
  fetchFishingChart,
  fetchIllegalFishingChart,
  fetchTimeSeriesChart,
} from '../api/fishing'
import { getDonutColor } from '../components/charts/BubbleChart'
import type { DonutItem } from '../components/charts/BubbleChart'
import type { IllegalItem } from '../components/charts/LollipopChart'
import type { TimeSeriesPoint } from '../components/charts/HeatmapChart'

const DEBOUNCE_MS = 300

export function useViewportCharts(
  containerRef: RefObject<HTMLDivElement | null>,
  viewState: MapViewState,
  date: string,
) {
  const [bubbleData, setBubbleData] = useState<DonutItem[]>([])
  const [illegalData, setIllegalData] = useState<IllegalItem[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([])

  // Depend only on the scalar fields that actually change the viewport,
  // not the viewState object reference which changes on every render.
  const { longitude, latitude, zoom } = viewState

  useEffect(() => {
    const ctrl = new AbortController()

    const timer = setTimeout(async () => {
      const bbox = computeBBox(containerRef.current, viewState)
      if (!bbox || ctrl.signal.aborted) return

      try {
        const [chart, illegal, timeseries] = await Promise.all([
          fetchFishingChart(date, bbox, ctrl.signal),
          fetchIllegalFishingChart(date, bbox, ctrl.signal),
          fetchTimeSeriesChart(bbox, ctrl.signal),
        ])
        setBubbleData(
          (chart.data ?? []).map((item, i) => ({
            label: item.label,
            value: item.value,
            color: getDonutColor(i),
          }))
        )
        setIllegalData(illegal.data ?? [])
        setTimeSeriesData(timeseries.data ?? [])
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error('Chart fetch failed:', err)
      }
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, longitude, latitude, zoom])

  return { bubbleData, illegalData, timeSeriesData }
}
