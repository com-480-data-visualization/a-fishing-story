# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EPFL Data Visualization (COM-480) team project — an interactive web map of global fishing vessel activity, with charts showing vessel distribution by flag, illegal fishing (EEZ violations), and activity over time.

Deployed as a static site on GitHub Pages: https://com-480-data-visualization.github.io/a-fishing-story/

## Development Commands

**Start local data server** (required for DuckDB WASM to read parquet files):
```
python serve-data.py        # serves data/ at http://localhost:8001
```

**Configure frontend to use local data** — create `frontend/.env.local`:
```
VITE_DATA_BASE_URL=http://localhost:8001/parquet
```

**Run frontend dev server:**
```
cd frontend
npm run dev
```

**Build:**
```
cd frontend
npm run build    # runs tsc -b then vite build
```

**Lint:**
```
cd frontend
npm run lint
```

## Architecture

### No Backend

The app is fully static. There is no server-side API. All data queries run client-side via **DuckDB WASM** (an in-process analytical SQL engine compiled to WebAssembly) reading **Parquet files** over HTTP with range requests. In production, parquet files are hosted on Hugging Face Hub; locally, `serve-data.py` serves `data/` with CORS and HTTP 206 range support that Python's built-in server lacks.

### Data Flow

```
Parquet files (HuggingFace / local)
  → HTTP range requests (DuckDB WASM)
  → SQL queries (src/db/queries.ts)
  → typed results via apache-arrow
  → API wrappers (src/api/fishing.ts)
  → React hooks (src/hooks/)
  → components
```

### Key Files

| File | Role |
|---|---|
| `src/db/index.ts` | DuckDB WASM singleton — `getConnection()` initializes once |
| `src/db/queries.ts` | All SQL queries; `DATA_BASE_URL` is read from here |
| `src/api/fishing.ts` | Thin wrappers over queries; all shared TypeScript types |
| `src/hooks/useMapState.ts` | Map data, viewState, timeline playback |
| `src/hooks/useViewportCharts.ts` | Fetches all 3 chart datasets on viewport change (300ms debounce, AbortController) |
| `src/components/Map.tsx` | DeckGL + MapLibre rendering; `SolidPolygonLayer` grid |
| `src/components/charts/` | `BubbleChart`, `LollipopChart`, `HeatmapChart`, `ChartSlot` |
| `src/pages/Home.tsx` | Main page — assembles map, timeline, zone pins, chart panel |

### Parquet Data

- **Daily fishing effort**: `data/parquet/daily_split/fleet-daily-{YYYY-MM-DD}.parquet`
  - Fields: `cell_ll_lat`, `cell_ll_lon`, `flag`, `geartype`, `fishing_hours`, `mmsi_present`
- **Monthly time series** (pre-aggregated): `data/parquet/timeseries_grid.parquet`
  - Fields: `year`, `month`, `cell_ll_lat`, `cell_ll_lon`, `vessel_count`

### Charts Architecture

Three charts are rendered as custom SVG React components — no external chart library:

1. **BubbleChart** — donut/bubble chart of vessel % by flag country
2. **LollipopChart** — top 5 illegal fishing countries (EEZ violations) — currently stubbed, `fetchIllegalFishingChart` returns empty array
3. **HeatmapChart** — time series of vessel count by month/year

`ChartSlot` wraps each chart: compact/scaled by default, expands on hover, locks on click.

The chart panel in `Home.tsx` is currently wrapped in `{false && ...}` (hidden). The toggle button (`showChart` state) exists but does not yet control the chart panel visibility.

### Routing

Three pages via react-router-dom: `/` (Landing), `/map` (Home), `/about` (About).

## Adding a New Query

1. Add SQL in `src/db/queries.ts`, accepting `AsyncDuckDBConnection` + params, returning typed rows via `table.toArray()`
2. Add a type and wrapper in `src/api/fishing.ts`
3. Call from `useViewportCharts` (or a new hook) alongside the existing fetches

## Tech Stack

- React 19 + TypeScript + Vite
- deck.gl v9 (`SolidPolygonLayer`) + maplibre-gl + react-map-gl
- DuckDB WASM (`@duckdb/duckdb-wasm`) + apache-arrow
- All charts: custom SVG (no Recharts or similar installed)
