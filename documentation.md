# Documentation

## Frontend

### Stack

- **Vite** — build tool and dev server
- **React 19** + **TypeScript**
- **React Router v7** — client-side routing

### Structure

```
frontend/
  src/
    api/
      client.ts     # fetch wrapper (GET, POST), reads VITE_API_URL
    pages/
      Home.tsx      # route: /
      About.tsx     # route: /about
    App.tsx         # route definitions
    main.tsx        # entry point
  .env              # environment variables
```

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Base URL of the FastAPI backend |

### Setup

```bash
cd frontend
npm install
```

### Run

```bash
npm run dev
```

Dev server runs at `http://localhost:5173`.

## Backend

### Stack

- **FastAPI** — REST API framework
- **DuckDB** — in-process OLAP database for querying parquet files
- **PyArrow** — Arrow IPC serialization
- **Uvicorn** — ASGI server

### Structure

```
backend/
  routers/
    fishing.py    # API endpoints: /daily, /daily/range, /meta
  main.py         # FastAPI app, CORS middleware, router registration
  db.py           # Database class with thread-local DuckDB connections
  schemas.py      # Pydantic request models (DailyParams, RangeParams)
```

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated list of allowed CORS origins |

### Setup

```bash
pip install -r requirements.txt
```

### Run

```bash
uvicorn backend.main:app --reload
```

Dev server runs at `http://localhost:8000`.

### API endpoints

All endpoints are prefixed with `/api/fishing`. Data responses use the Arrow IPC stream format (`application/vnd.apache.arrow.stream`).

#### `GET /api/fishing/daily`

Returns fishing effort for a single day aggregated to a given resolution.

Query parameters:

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `date` | `YYYY-MM-DD` | yes | — | Date to query |
| `resolution` | float | no | `0.08` | Grid cell size in degrees (max `0.512`) |
| `flag` | string | no | — | Filter by vessel flag (country ISO code) |
| `geartype` | string | no | — | Filter by gear type |
| `lat_min` | float | no | `-90` | Bounding box south |
| `lat_max` | float | no | `90` | Bounding box north |
| `lon_min` | float | no | `-180` | Bounding box west |
| `lon_max` | float | no | `180` | Bounding box east |

Arrow response schema:

| Column | Type | Description |
|---|---|---|
| `lat` | float32 | Lower-left latitude of grid cell |
| `lon` | float32 | Lower-left longitude of grid cell |
| `fishing_hours` | float32 | Total fishing hours in the cell |

#### `GET /api/fishing/daily/range`

Returns fishing effort per day for a date range, same filters as above but with `date_start` / `date_end` instead of `date`.

Arrow response schema adds a `date` (utf8, `YYYY-MM-DD`) column and rows are ordered by date.

#### `GET /api/fishing/meta`

Returns dataset metadata (cached to `data/meta.json` after first call).

```json
{
  "date_min": "YYYY-MM-DD",
  "date_max": "YYYY-MM-DD",
  "flags": ["CHN", "ESP", ...],
  "geartypes": ["drifting_longlines", "trawlers", ...]
}
```
