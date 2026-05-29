# A Fishing Story

Interactive web visualization of global fishing activity through a geopolitical lens, built on Global Fishing Watch AIS data and Marine Regions EEZ boundaries.

Live site: https://com-480-data-visualization.github.io/a-fishing-story/

- **Process book:** [process-book.pdf](process-book.pdf)
- **Screencast:** [screencast.mp4](screencast.mp4)

Course project for COM-480. Earlier milestone write-ups are preserved in [README-M1-M2.md](README-M1-M2.md).

## Architecture

The app is fully static — there is no backend server in production.

- **Frontend** — React 19 + TypeScript, built with Vite. The map uses deck.gl. Charts are hand-written SVG.
- **Data layer** — DuckDB-WASM runs in a Web Worker in the browser and queries Parquet files directly over HTTP range requests. In production those files are hosted on the HuggingFace dataset [`Plouc314/fishing`](https://huggingface.co/datasets/Plouc314/fishing).
- **Data preparation** — Python notebooks under `notebooks/` convert the raw GFW CSV dump to Parquet, pre-join EEZ membership, and build the derived files the frontend reads.

Files the frontend fetches (under `VITE_DATA_BASE_URL`):

| Path | Purpose |
|---|---|
| `daily_split/fleet-daily-YYYY-MM-DD.parquet` | Per-day fishing effort |
| `zones/<zone>-<year>.parquet` | Zone timelapse animations |
| `timeseries_grid.parquet` | Monthly time series |
| `eez_grid.parquet` | Grid-cell → EEZ lookup |
| `eez_boundaries.geojson` | EEZ boundary layer |

## Repository layout

```
frontend/             React + Vite app (the deployed artifact)
notebooks/            Data preprocessing notebooks
data/                 Raw + derived data (gitignored)
serve-data.py         Local static server for data/ with CORS + Range support
hf.py                 Uploads derived data to the HuggingFace dataset
requirements.txt      Python deps for the notebooks / data scripts
.github/workflows/    GitHub Pages deploy
```

## Running locally

### 1. Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

By default the frontend reads data from `http://localhost:8001/parquet`. To point
it elsewhere (e.g. straight at HuggingFace), create `frontend/.env.local`:

```
VITE_DATA_BASE_URL=https://huggingface.co/datasets/Plouc314/fishing/resolve/main/parquet
```

### 2. Data (choice of two)

**Option A — serve data from HuggingFace** (no local data needed). Set
`VITE_DATA_BASE_URL` as above and skip to running the frontend.

**Option B — serve data locally.** You need the derived Parquet files under
`data/parquet/` (produced by the notebooks, or downloaded from the HuggingFace
dataset). Then:

```bash
python serve-data.py        # http://localhost:8001
```

`serve-data.py` adds the two things `python -m http.server` lacks for DuckDB-WASM:
CORS headers and HTTP Range request support (DuckDB reads only the parquet
footer + relevant row groups instead of full files).

### 3. Data preprocessing (optional)

If you want to regenerate the Parquet artifacts from raw GFW CSVs:

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
jupyter lab    # then run notebooks/data_processing.ipynb, preprocessing.ipynb, ...
```

See [data-processing.md](data-processing.md) for details on the raw → Parquet
conversion.

## Deployment

Pushes to `master` trigger `.github/workflows/deploy.yml`, which:

1. Builds the frontend with `VITE_DATA_BASE_URL` pointed at the HuggingFace
   dataset `Plouc314/fishing`.
2. Publishes `frontend/dist` to GitHub Pages via `peaceiris/actions-gh-pages`.

The Vite `base` is hard-coded to `/a-fishing-story/` in `frontend/vite.config.ts`
to match the Pages URL.

### Updating the deployed dataset

After regenerating files in `data/parquet/`, push them to HuggingFace with:

```bash
huggingface-cli login        # once
python hf.py
```

This re-uploads the full set of files the frontend reads (see `hf.py` for the
exact `allow_patterns`). It uses `upload_large_folder` because `daily_split/`
alone is ~1800 files.

## Authors

| Name | SCIPER |
|---|---|
| Alexandre Goumaz | 333934 |
| Mathieu Senent | 362767 |
| Nayan Adani | 326841 |
