import BarChart from './charts/BarChart'
import IllegalFishingChart from './charts/IllegalFishingChart'
import HeatmapChart from './charts/HeatmapChart'
import type { BarItem } from './charts/BarChart'
import type { IllegalItem } from './charts/IllegalFishingChart'
import type { TimeSeriesPoint } from './charts/HeatmapChart'
import type { Zone } from '../data/zones'
import { theme } from '../theme'

export const PANEL_W = 420

interface ChartPanelProps {
  open: boolean
  bubbleData: BarItem[]
  illegalData: IllegalItem[]
  timeSeriesData: TimeSeriesPoint[]
  /** When set, a zone description header is shown above the charts. */
  zone?: Zone | null
}

/** Thin horizontal rule separating stacked charts. */
function Divider() {
  return <div style={{ height: 1, background: theme.borderSubtle, margin: '4px 22px' }} />
}

/** Zone name + description, shown at the top of the panel in zone-timelapse mode. */
function ZoneHeader({ zone }: { zone: Zone }) {
  const paragraphs = zone.description.split('\n\n')
  return (
    <div style={{ padding: '0 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 9, height: 9, borderRadius: '50%',
          background: zone.color,
          boxShadow: `0 0 8px ${zone.color}88`,
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary, lineHeight: 1.2 }}>
          {zone.name}
        </span>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.7, color: theme.textSecondary }}>
        {paragraphs.map((para, i) => (
          <p key={i} style={{ margin: 0, marginBottom: i < paragraphs.length - 1 ? 10 : 0 }}>
            {para}
          </p>
        ))}
      </div>
    </div>
  )
}

/**
 * Fixed-width side panel holding the three charts, stacked vertically and
 * separated by simple dividers. In zone-timelapse mode a zone description is
 * shown above them; the panel scrolls when the content overflows. Collapses to
 * zero width when closed; the map area (a flex sibling) reflows to fill it.
 */
export default function ChartPanel({ open, bubbleData, illegalData, timeSeriesData, zone }: ChartPanelProps) {
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
        {zone && <ZoneHeader zone={zone} />}
        {zone && <Divider />}
        <BarChart data={bubbleData} />
        <Divider />
        <IllegalFishingChart data={illegalData} />
        <Divider />
        <HeatmapChart data={timeSeriesData} />
      </div>
    </div>
  )
}
