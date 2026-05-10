#!/usr/bin/env python3
"""
add_eez_to_daily.py
────────────────────
Enrich daily parquet files with EEZ information.

Input:   data/parquet/daily/fleet-daily-YYYY-MM.parquet  (60 files)
Output:  data/parquet/daily_with_eez/fleet-daily-YYYY-MM.parquet

Columns added:
  eez_iso       str   ISO-3 country code of the EEZ  ("INT" = international waters)
  eez_sovereign str   Sovereign country name          ("International Waters" if none)

A vessel is considered in foreign waters when:
  eez_iso != "INT"  AND  flag != eez_iso

Run with:
  conda run -n fishing python add_eez_to_daily.py

Strategy:
  Each file is processed independently in parallel:
    1. Read parquet → deduplicate to unique (lat, lon) cells for that file
    2. Spatial join those unique cells against the EEZ shapefile
    3. Merge result back to all rows (fast pandas hash-join)
    4. Write enriched parquet

  The EEZ shapefile is loaded once per worker process (not per file).
  Using 4 workers keeps peak RAM manageable (~1 GB per worker).
"""

import time
import multiprocessing
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import numpy as np
import pandas as pd
import geopandas as gpd

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT     = Path(__file__).parent
DATA_DIR = ROOT / "data"
EEZ_PATH = DATA_DIR / "World_EEZ_v12_20231025" / "eez_v12.shp"
DAILY_IN = DATA_DIR / "parquet" / "daily"
DAILY_OUT = DATA_DIR / "parquet" / "daily_with_eez"

# 4 workers: each loads its own EEZ copy (~150 MB) + one parquet file at a time.
# More workers = faster but higher RAM. 4 is safe on a MacBook Air (8 GB).
N_WORKERS = 4


# ── EEZ loader (called once per worker process) ────────────────────────────────

_EEZ_CACHE: gpd.GeoDataFrame | None = None

def _get_eez() -> gpd.GeoDataFrame:
    """
    Load and cache the EEZ GeoDataFrame in the worker process.
    Subsequent calls within the same process return the cached object.
    """
    global _EEZ_CACHE
    if _EEZ_CACHE is None:
        eez = gpd.read_file(EEZ_PATH)
        eez = eez[eez["POL_TYPE"] == "200NM"].copy()
        # Simplify to 0.01° (~1 km) — matches grid resolution, speeds up sjoin
        eez["geometry"] = eez["geometry"].simplify(0.01, preserve_topology=True)
        eez = eez[["ISO_SOV1", "SOVEREIGN1", "geometry"]].rename(columns={
            "ISO_SOV1":   "eez_iso",
            "SOVEREIGN1": "eez_sovereign",
        })
        _EEZ_CACHE = eez.reset_index(drop=True)
    return _EEZ_CACHE


# ── Per-file worker ────────────────────────────────────────────────────────────

def _process_file(args: tuple[str, str]) -> str:
    """
    Enrich one daily parquet file with EEZ columns.
    Returns a log string for the main process.
    """
    in_path_str, out_path_str = args
    in_path  = Path(in_path_str)
    out_path = Path(out_path_str)

    if out_path.exists():
        return f"skip  {out_path.name}"

    t0 = time.time()

    # 1. Load parquet
    df = pd.read_parquet(in_path)

    # 2. Unique (lat, lon) cells only — avoids running sjoin on duplicate coords
    coords = (
        df[["cell_ll_lat", "cell_ll_lon"]]
        .drop_duplicates()
        .reset_index(drop=True)
        .copy()
    )

    # 3. Spatial join on unique cells
    eez = _get_eez()
    points_gdf = gpd.GeoDataFrame(
        coords,
        geometry=gpd.points_from_xy(coords["cell_ll_lon"], coords["cell_ll_lat"]),
        crs="EPSG:4326",
    )
    joined = gpd.sjoin(points_gdf, eez, how="left", predicate="within")

    # If a point lands in an overlapping-claim polygon, keep the first match
    joined = joined.drop_duplicates(subset=["cell_ll_lat", "cell_ll_lon"])

    lookup = joined[["cell_ll_lat", "cell_ll_lon", "eez_iso", "eez_sovereign"]].copy()
    lookup["eez_iso"]       = lookup["eez_iso"].fillna("INT")
    lookup["eez_sovereign"] = lookup["eez_sovereign"].fillna("International Waters")

    # 4. Merge back to all rows (pure pandas hash-join, fast)
    df = df.merge(lookup, on=["cell_ll_lat", "cell_ll_lon"], how="left")
    df["eez_iso"]       = df["eez_iso"].fillna("INT")
    df["eez_sovereign"] = df["eez_sovereign"].fillna("International Waters")

    # 5. Write enriched parquet
    df.to_parquet(out_path, index=False, compression="snappy")

    elapsed = time.time() - t0
    size_mb = out_path.stat().st_size / 1e6
    n_unique = len(coords)
    return f"wrote {out_path.name}  ({n_unique/1e6:.1f}M unique cells, {size_mb:.0f} MB, {elapsed:.0f}s)"


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    DAILY_OUT.mkdir(parents=True, exist_ok=True)

    files = sorted(DAILY_IN.glob("fleet-daily-*.parquet"))
    if not files:
        raise FileNotFoundError(f"No parquet files found in {DAILY_IN}")

    already_done = sum(1 for f in files if (DAILY_OUT / f.name).exists())
    todo = [f for f in files if not (DAILY_OUT / f.name).exists()]

    print(f"Daily files total : {len(files)}")
    print(f"Already done      : {already_done}  (will be skipped)")
    print(f"To process        : {len(todo)}")
    print(f"Workers           : {N_WORKERS}\n")

    if not todo:
        print("Nothing to do.")
        return

    tasks = [(str(f), str(DAILY_OUT / f.name)) for f in todo]

    t_total = time.time()
    done = 0

    with ProcessPoolExecutor(max_workers=N_WORKERS) as pool:
        futures = {pool.submit(_process_file, t): t for t in tasks}
        for fut in as_completed(futures):
            done += 1
            try:
                msg = fut.result()
            except Exception as exc:
                in_path = futures[fut][0]
                msg = f"ERROR {Path(in_path).name}: {exc}"
            print(f"[{done:2d}/{len(tasks)}] {msg}")

    elapsed = time.time() - t_total
    print(f"\nAll done in {elapsed/60:.1f} min  ({elapsed:.0f}s)")
    print(f"Output: {DAILY_OUT}")


if __name__ == "__main__":
    main()
