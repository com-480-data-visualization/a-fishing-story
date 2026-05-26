# Data Processing Notes

Raw data lives under `data/`. Parquet outputs go to `data/parquet/`.
Conversion is implemented in `notebooks/data_processing.ipynb`.

---

## Fleet Daily

**Location:** `data/fleet-daily-<year>/`

```
fleet-daily-2020/      12 GB   (366 CSV files — leap year)
fleet-daily-2021/      14 GB   (365 CSV files)
fleet-daily-2022/      15 GB   (365 CSV files)
fleet-daily-2023/      19 GB   (365 CSV files)
fleet-daily-2024/      19 GB   (366 CSV files — leap year)
```

**File naming:** `fleet-daily-csvs-100-v3-YYYY-MM-DD.csv` — one file per day.
Each file has ~417,000 rows and is 30–55 MB. Total: ~79 GB.

**Schema:**

| Column         | Type    | Description |
|----------------|---------|-------------|
| `date`         | DATE    | Date in YYYY-MM-DD format |
| `cell_ll_lat`  | FLOAT   | Latitude of the lower-left corner of the 0.1° grid cell |
| `cell_ll_lon`  | FLOAT   | Longitude of the lower-left corner of the 0.1° grid cell |
| `flag`         | STRING  | Vessel flag state (ISO3, e.g. `CHN`, `TWN`) |
| `geartype`     | STRING  | Fishing gear type (e.g. `trawlers`, `drifting_longlines`) |
| `hours`        | FLOAT   | AIS broadcast hours in this cell on this day |
| `fishing_hours`| FLOAT   | Hours detected as fishing by the GFW model |
| `mmsi_present` | INTEGER | Number of distinct MMSI in this cell on this day |

**Parquet output:** `data/parquet/daily/fleet-daily-YYYY-MM.parquet` — one file per calendar month (60 files).

| Year | Rows | Parquet size | CSV size | Ratio |
|------|------|-------------|----------|-------|
| 2020 | 237,070,088 | 1.5 GB | 12 GB | 8× |
| 2021 | 272,904,806 | 1.7 GB | 14 GB | 8× |
| 2022 | 306,585,089 | 2.1 GB | 15 GB | 7× |
| 2023 | 378,225,090 | 2.7 GB | 19 GB | 7× |
| 2024 | 377,629,592 | 2.7 GB | 19 GB | 7× |
| **Total** | **1,572,414,665** | **~11 GB** | **~79 GB** | **~7×** |

File sizes range from 107 MB (2020-02) to 292 MB (2023-09), reflecting seasonal patterns and year-over-year growth in AIS coverage. Row counts range from ~17 M (2020-01) to ~37 M (2023-09) rows per monthly file.

**Parquet column types:** `float32` for coordinates/hours, `int16` for `mmsi_present`, dictionary encoding for `flag` (~200 distinct values) and `geartype` (~20 distinct values). Compression: Snappy.

---

## Fleet Monthly

**Location:** `data/fleet-monthly-<year>/`

```
fleet-monthly-2020/    730 MB  (12 CSV files)
fleet-monthly-2021/    747 MB  (12 CSV files)
fleet-monthly-2022/    778 MB  (12 CSV files)
fleet-monthly-2023/    842 MB  (12 CSV files)
fleet-monthly-2024/    799 MB  (12 CSV files)
```

**File naming:** `fleet-monthly-csvs-10-v3-YYYY-MM-01.csv` — one file per month.
Total: ~3.9 GB.

**Schema:** Same as fleet-daily with two extra columns:

| Column         | Type    | Description |
|----------------|---------|-------------|
| `date`         | DATE    | First day of the month |
| `year`         | INTEGER | Year |
| `month`        | INTEGER | Month |
| `cell_ll_lat`  | FLOAT   | Grid cell latitude (lower-left) |
| `cell_ll_lon`  | FLOAT   | Grid cell longitude (lower-left) |
| `flag`         | STRING  | Vessel flag state (ISO3) |
| `geartype`     | STRING  | Fishing gear type |
| `hours`        | FLOAT   | AIS broadcast hours |
| `fishing_hours`| FLOAT   | Hours detected as fishing |
| `mmsi_present` | INTEGER | Number of distinct MMSI |

**Parquet output:** `data/parquet/monthly/fleet-monthly-YYYY.parquet` — one file per year (5 files).

| Year | Rows | Parquet size | CSV size | Ratio |
|------|------|-------------|----------|-------|
| 2020 | 12,603,878 | 88 MB | 730 MB | 8× |
| 2021 | 12,954,173 | 93 MB | 747 MB | 8× |
| 2022 | 13,463,690 | 104 MB | 778 MB | 7× |
| 2023 | 14,560,171 | 109 MB | 842 MB | 8× |
| 2024 | 13,838,619 | 105 MB | 799 MB | 8× |
| **Total** | **67,420,531** | **~524 MB** | **~3.9 GB** | **~7×** |

---

## MMSI Daily

**Location:** `data/mmsi-daily-<year>/`

```
mmsi-daily-2020/    2.2 GB  (366 CSV files — leap year)
mmsi-daily-2021/    2.4 GB  (365 CSV files)
mmsi-daily-2022/    2.8 GB  (365 CSV files)
mmsi-daily-2023/    3.3 GB  (365 CSV files)
mmsi-daily-2024/    3.3 GB  (366 CSV files — leap year)
```

**File naming:** `mmsi-daily-csvs-10-v3-YYYY-MM-DD.csv` — one file per day, 4–10 MB each.
Total: ~13.9 GB.

**Schema:** Individual vessel resolution — no flag/geartype aggregation, one row per (vessel, grid cell, day):

| Column         | Type    | Description |
|----------------|---------|-------------|
| `date`         | DATE    | Date in YYYY-MM-DD format |
| `cell_ll_lat`  | FLOAT   | Grid cell latitude (lower-left) |
| `cell_ll_lon`  | FLOAT   | Grid cell longitude (lower-left) |
| `mmsi`         | STRING  | Individual vessel identifier (AIS) |
| `hours`        | FLOAT   | AIS broadcast hours in this cell on this day |
| `fishing_hours`| FLOAT   | Hours detected as fishing |

**Parquet output:** `data/parquet/mmsi-daily/mmsi-daily-YYYY.parquet` — one file per year (5 files). Written using `ParquetWriter` month-by-month to keep peak RAM to ~one month of data.

| Year | Rows | Parquet size | CSV size | Ratio |
|------|------|-------------|----------|-------|
| 2020 | 55,991,204 | 382 MB | 2.2 GB | 6× |
| 2021 | 60,693,166 | 414 MB | 2.4 GB | 6× |
| 2022 | 72,195,082 | 528 MB | 2.8 GB | 5× |
| 2023 | 84,786,933 | 588 MB | 3.3 GB | 6× |
| 2024 | 84,800,259 | 592 MB | 3.3 GB | 6× |
| **Total** | **358,466,644** | **~2.4 GB** | **~13.9 GB** | **~6×** |

---

## Fishing Vessels

**Location:** `data/94cd33a0-.../fishing-vessels-v3.csv` — single file, 110 MB.

Vessel-level reference table: one row per (MMSI, year). Contains vessel classification, physical dimensions, engine power, and tonnage from multiple registries (AIS, official registry, GFW-inferred).

| Column | Type | Description |
|--------|------|-------------|
| `mmsi` | STRING | Vessel identifier |
| `year` | INTEGER | Year of observation |
| `flag_ais` / `flag_registry` / `flag_gfw` | STRING | Flag from three sources |
| `vessel_class_inferred` / `_registry` / `_gfw` | STRING | Gear class from three sources |
| `vessel_class_inferred_score` | FLOAT | Confidence score for inferred class |
| `self_reported_fishing_vessel` | BOOLEAN | Self-reported flag |
| `length_m_*` / `engine_power_kw_*` / `tonnage_gt_*` | FLOAT | Physical specs (3 sources each) |
| `registries_listed` | STRING | Registry membership |
| `active_hours` / `fishing_hours` | FLOAT | Annual activity totals |

**Format:** Kept as CSV — at 110 MB it loads instantly with pandas and needs no conversion.

---

## Processed Data Layout

All parquet output lives under `data/parquet/` (~14 GB total).

```
data/parquet/
├── daily/           11 GB   60 files — one per calendar month
│   ├── fleet-daily-2020-01.parquet   (17.5M rows,  114 MB)
│   ├── fleet-daily-2020-02.parquet   (16.3M rows,  107 MB)
│   │   ...
│   └── fleet-daily-2024-12.parquet   (32.5M rows,  247 MB)
│
├── monthly/        524 MB    5 files — one per year
│   ├── fleet-monthly-2020.parquet    (12.6M rows,   88 MB)
│   ├── fleet-monthly-2021.parquet    (13.0M rows,   93 MB)
│   ├── fleet-monthly-2022.parquet    (13.5M rows,  104 MB)
│   ├── fleet-monthly-2023.parquet    (14.6M rows,  109 MB)
│   └── fleet-monthly-2024.parquet    (13.8M rows,  105 MB)
│
└── mmsi-daily/       2.4 GB    5 files — one per year
    ├── mmsi-daily-2020.parquet       (56.0M rows,  382 MB)
    ├── mmsi-daily-2021.parquet       (60.7M rows,  414 MB)
    ├── mmsi-daily-2022.parquet       (72.2M rows,  528 MB)
    ├── mmsi-daily-2023.parquet       (84.8M rows,  588 MB)
    └── mmsi-daily-2024.parquet       (84.8M rows,  592 MB)
```

| Dataset | Files | Total rows | Size |
|---------|-------|-----------|------|
| fleet-daily | 60 | 1,572,414,665 | 11 GB |
| fleet-monthly | 5 | 67,420,531 | 524 MB |
| mmsi-daily | 5 | 358,466,644 | 2.4 GB |
| **Total** | **70** | **1,998,301,840** | **~14 GB** |

---

## Frontend-Ready Artifacts

The Parquet files produced above are still too coarse-grained for the browser to fetch directly. A second stage, implemented in `notebooks/preprocessing.ipynb` and `notebooks/zone_timelapse.ipynb`, derives the files the frontend actually reads via DuckDB-WASM.

All outputs land under `data/parquet/` and are uploaded to the HuggingFace dataset by `hf.py`.

### `preprocessing.ipynb`

Reads from `data/parquet/daily/fleet-daily-YYYY-MM.parquet` and produces:

- **`timeseries_grid.parquet`** — monthly aggregate over a coarse spatial grid, used by the time-series chart. Single file, ~20–80 MB.
- **`daily_split/fleet-daily-YYYY-MM-DD.parquet`** — one Parquet per day (~1825 files for 2020–2024), so the map only fetches the cells it needs for the selected day. Sorted by `(lat, lon)` with small row groups so DuckDB-WASM range requests stay tight. `UNKNOWN-<ISO>` flags are collapsed into `<ISO>` here.
- **`eez_grid.parquet`** — pre-joined lookup mapping each grid cell to its EEZ (or High Seas), built from the Marine Regions shapefile under `data/World_EEZ_v12_20231025/`.

### `zone_timelapse.ipynb`

Builds the per-zone timelapse animations shown when a point of interest is clicked.

- **`zones/<zone-id>-<year>.parquet`** — one Parquet per (zone, year). Zone ids are defined in `frontend/src/data/zones.ts`.

### EEZ boundary layer

- **`eez_boundaries.geojson`** — simplified EEZ polygons consumed directly by the deck.gl map. Derived from the Marine Regions shapefile (not produced by a notebook).
