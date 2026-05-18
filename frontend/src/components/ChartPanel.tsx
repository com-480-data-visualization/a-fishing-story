import BarChart from './charts/BarChart'
import IllegalFishingChart from './charts/IllegalFishingChart'
import HeatmapChart from './charts/HeatmapChart'
import type { BarItem } from './charts/BarChart'
import type { IllegalItem } from './charts/IllegalFishingChart'
import type { TimeSeriesPoint } from './charts/HeatmapChart'
import { theme } from '../theme'

export const PANEL_W = 420

interface ChartPanelProps {
  open: boolean
  bubbleData: BarItem[]
  illegalData: IllegalItem[]
  timeSeriesData: TimeSeriesPoint[]
}

/** Thin horizontal rule separating stacked charts. */
function Divider() {
  return <div style={{ height: 1, background: theme.borderSubtle, margin: '4px 22px' }} />
}

/**
 * Fixed-width side panel holding the three charts, stacked vertically and
 * separated by simple dividers. Collapses to zero width when closed; the map
 * area (a flex sibling) reflows to fill the freed space.
 */
export default function ChartPanel({ open, bubbleData, illegalData, timeSeriesData }: ChartPanelProps) {
  return (
    <div style={{
      width: open ? PANEL_W : 0,
      flexShrink: 0,
      height: '100%',
      overflow: 'hidden',
      transition: 'width 0.3s ease',
      background: theme.panelBg,
      borderLeft: open ? `1px solid ${theme.border}` : 'none',
    }}>
      {/* Fixed-width inner track so charts don't reflow during the collapse animation */}
      <div style={{
        width: PANEL_W,
        height: '100%',
        boxSizing: 'border-box',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        padding: '22px 0',
      }}>
        <BarChart data={bubbleData} />
        <Divider />
        <IllegalFishingChart data={illegalData} />
        <Divider />
        <HeatmapChart data={timeSeriesData} />
      </div>
    </div>
  )
}
