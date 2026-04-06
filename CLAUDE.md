# A Fishing Story — CLAUDE.md

## Project Overview
EPFL Master of Financial Engineering student project for a Data Visualization course.
Interactive web map visualizing global fishing vessel activity over 4 years worldwide.
Team project shared via GitHub. This file describes the task assigned to Nayan.

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite, located in `./frontend/`
- **Map rendering**: deck.gl + maplibre-gl + react-map-gl
- **Data (frontend)**: apache-arrow (parquet files read directly)
- **Backend**: Python (FastAPI), located in `./backend/`
- **No external chart library is installed** — the existing graph is built custom (likely SVG). Follow the same approach for new graphs, or add Recharts if SVG becomes too complex (discuss before adding dependencies).

## Project Structure
```
a-fishing-story/
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── components/
│       │   └── Map.tsx        ← MAIN FILE: map + existing graph, all in here
│       ├── hooks/             ← custom React hooks
│       ├── api/               ← API call functions
│       └── pages/
├── backend/
│   ├── main.py                ← FastAPI entry point
│   ├── routers/
│   │   └── fishing.py         ← main API routes, add new endpoints here
│   ├── db.py
│   └── schemas.py             ← Pydantic schemas, add new ones here
├── data/
│   ├── parquet/
│   │   ├── daily/             ← daily vessel positions
│   │   ├── daily_with_eez/    ← daily positions with EEZ zone joined
│   │   ├── monthly/           ← monthly aggregates
│   │   ├── monthly_with_eez/  ← monthly aggregates with EEZ info ← USE THIS for Graph 3
│   │   ├── mmsi_daily_with_eez/
│   │   └── mmsi-daily/
│   └── World_EEZ_v12_20231025/  ← EEZ boundary shapefiles
└── notebooks/
    ├── data_processing.ipynb
    └── explore.ipynb           ← useful to understand data fields
```

## Data Description

### Vessel Data (Parquet)
Each row represents a vessel position at a point in time with fields including:
- **lat/lon**: vessel position
- **flag** (or similar): country the vessel belongs to (its nationality)
- **date/timestamp** (exact field name — check parquet schema): time of observation, 4 years of data
- **eez_sovereign** (or similar): which country's EEZ the vessel is currently inside (present in `*_with_eez` datasets)

> Before writing any code, read `notebooks/explore.ipynb` or inspect the parquet schema to confirm exact field names for flag, timestamp, and EEZ fields.

### EEZ Definition
EEZ = Exclusive Economic Zone (200 nautical miles from a country's coast).
A vessel is considered **fishing illegally** in this context if:
`vessel.flag != eez.sovereign_country` AND the vessel is inside an EEZ.

## Current Application State

### What already exists
- Interactive world map (deck.gl + maplibre) showing fishing vessel positions and movements over time
- **Graph 1 (already built)**: A toggle button in the upper-right corner of the map
  - On click: a graph appears showing the **% of vessels by flag country** for the current map viewport
  - On click again: the graph disappears (toggle behavior)
  - The graph **updates dynamically** as the user pans or zooms the map

### How Graph 1 works — READ THIS FIRST
Before writing any new code, carefully read `frontend/src/components/Map.tsx` to understand:
1. How the toggle button is implemented (state variable, onClick handler)
2. How the graph component/SVG is rendered and hidden
3. How the current map viewport bounds (bbox) are captured and passed to the graph
4. How the API is called to fetch data for the current viewport
5. What the graph looks like visually (styling, colors, positioning)

**The two new graphs must follow exactly the same patterns.**

---

## My Task: Add Two New Graphs

### Graph 2 — Illegal Fishing by Country (EEZ Violations)

**What it shows:**
For the current map viewport, identify the **top 5 countries** whose vessels are most frequently fishing inside a foreign EEZ (illegally). For each of those 5 countries, show the **percentage of their vessels that are inside a foreign EEZ**.

**Example:**
- China has 100 vessels visible on the map
- 50 of those are inside an EEZ that does not belong to China
- → Show China at 50%
- Do this for the top 5 countries by absolute number of illegal vessels

**Behavior:**
- Same toggle button behavior as Graph 1 (show/hide on click)
- Updates dynamically when user pans or zooms the map
- Use `daily_with_eez` or `mmsi_daily_with_eez` parquet data

**Implementation notes:**
- Add a new backend API endpoint in `backend/routers/fishing.py`
- The endpoint receives the current map bbox (min_lat, max_lat, min_lon, max_lon)
- It returns the top 5 countries with their illegal fishing percentage
- Frontend calls this endpoint and renders the graph the same way as Graph 1

---

### Graph 3 — Fishing Activity Over Time (Time Series)

**What it shows:**
For the current map viewport, show how fishing activity evolved over the 4-year period.
- X axis: time (by month, across all 4 years)
- Y axis: number of vessels (or fishing hours if available)
- A single line or bar chart showing the trend over time

**Behavior:**
- Same toggle button behavior as Graph 1 (show/hide on click)
- Updates dynamically when user pans or zooms the map
- Use `monthly_with_eez` or `monthly` parquet data (monthly granularity is enough)

**Implementation notes:**
- Add a new backend API endpoint in `backend/routers/fishing.py`
- The endpoint receives the current map bbox
- It returns an array of { month, year, vessel_count } objects
- Frontend renders a time series graph following the same style as Graph 1

---

## Implementation Guidelines

1. **Start by reading** `frontend/src/components/Map.tsx` and `backend/routers/fishing.py` fully before writing any code
2. **Read** `notebooks/explore.ipynb` to confirm exact parquet field names
3. **Match the existing code style** exactly — same patterns, same naming conventions, same file structure
4. **Do not install new npm packages** without flagging it first — prefer using the same approach as Graph 1
5. **Backend**: Follow existing endpoint patterns in `fishing.py` and add new Pydantic schemas in `schemas.py`
6. **Frontend**: If graph components get large, extract them into separate files in `frontend/src/components/` (e.g., `IllegalFishingChart.tsx`, `TimeSeriesChart.tsx`)
7. **Test each graph independently** before combining them

## Definition of Done
- [ ] Graph 2 (illegal fishing %) appears/disappears on toggle, updates on map move
- [ ] Graph 3 (time series) appears/disappears on toggle, updates on map move
- [ ] Both graphs match the visual style of Graph 1
- [ ] No TypeScript errors
- [ ] Backend endpoints return correct data for a sample bbox
