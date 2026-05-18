/**
 * Shared light-theme tokens.
 *
 * The basemap is a light style, so all overlay UI (panels, controls, charts,
 * timeline) draws from this palette to stay visually consistent with it.
 * Import as `import { theme } from '../theme'` and reference tokens instead of
 * hard-coding colors.
 */
export const theme = {
  // Surfaces
  panelBg: 'rgba(255, 255, 255, 0.94)',   // chart panel / large solid panels
  surfaceBg: 'rgba(255, 255, 255, 0.82)', // controls & legend floating over the map
  cardBg: 'rgba(255, 255, 255, 0.78)',    // individual chart cards
  inputBg: 'rgba(15, 23, 42, 0.05)',      // text inputs
  hoverBg: 'rgba(15, 23, 42, 0.05)',      // list-row hover

  // Borders
  border: 'rgba(15, 23, 42, 0.12)',
  borderStrong: 'rgba(15, 23, 42, 0.18)',
  borderSubtle: 'rgba(15, 23, 42, 0.07)',

  // Text
  textPrimary: '#16202e',
  textSecondary: 'rgba(22, 32, 46, 0.62)',
  textMuted: 'rgba(22, 32, 46, 0.42)',
  textFaint: 'rgba(22, 32, 46, 0.3)',

  // Accent (blue)
  accent: '#2563eb',
  accentBg: 'rgba(37, 99, 235, 0.12)',
  accentBgStrong: 'rgba(37, 99, 235, 0.2)',
  accentBorder: 'rgba(37, 99, 235, 0.45)',

  // Shadows
  shadowPanel: '0 8px 32px rgba(20, 30, 50, 0.18)',
  shadowSoft: '0 2px 10px rgba(20, 30, 50, 0.1)',

  // Chart helpers
  gridLine: 'rgba(15, 23, 42, 0.08)',
  tooltipBg: 'rgba(255, 255, 255, 0.97)',
} as const
