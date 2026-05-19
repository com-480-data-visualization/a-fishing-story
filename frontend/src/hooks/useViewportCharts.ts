import { useState, useEffect } from 'react'
import type { RefObject } from 'react'
import type { MapViewState } from '@deck.gl/core'
import { computeBBox } from '../utils'
import {
  fetchFishingChart,
  fetchIllegalFishingChart,
  fetchTimeSeriesChart,
} from '../api/fishing'
import type { BarItem } from '../components/charts/BarChart'
import type { IllegalItem } from '../components/charts/IllegalFishingChart'
import type { TimeSeriesPoint } from '../components/charts/HeatmapChart'

const DEBOUNCE_MS = 300

export function useViewportCharts(
  containerRef: RefObject<HTMLDivElement | null>,
  viewState: MapViewState,
  date: string,
  // Bump to force a refetch when the viewport bbox changed without viewState
  // changing — e.g. the map container was resized by the chart panel.
  revalidateKey: number = 0,
) {
  const [bubbleData, setBubbleData] = useState<BarItem[]>([])
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
          (chart.data ?? []).map(item => ({
            label: item.label,
            value: item.value,
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
  }, [date, longitude, latitude, zoom, revalidateKey])

  return { bubbleData, illegalData, timeSeriesData }
}
