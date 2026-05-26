"""Upload every data file the frontend reads to the HuggingFace dataset repo.

The frontend reads from `<VITE_DATA_BASE_URL>/...` where the base URL points at
`parquet/` in this repo. Paths in the repo mirror `data/` (the `data/` prefix is
stripped). Files read by the frontend:

  parquet/daily_split/fleet-daily-*.parquet   per-day fishing effort  (db/queries.ts)
  parquet/zones/<zone>-<year>.parquet         zone timelapses         (data/zoneTimelapse.ts)
  parquet/timeseries_grid.parquet             monthly time series     (db/queries.ts)
  parquet/eez_grid.parquet                    cell -> EEZ lookup      (db/queries.ts)
  parquet/eez_boundaries.geojson              EEZ boundary layer      (components/Map.tsx)

Re-uploads everything (changed or not) so the deployed dataset is always a
complete, consistent snapshot.

`daily_split/` alone is ~1800 files, which is too large for a single
`upload_folder` commit, so `upload_large_folder` is used instead. That helper
uploads in resumable batches but does NOT accept `path_in_repo` — it mirrors the
local tree under `folder_path` to the repo root. To still land files under
`parquet/...`, `folder_path` is the `data/` directory and `allow_patterns`
(matched relative to it) selects exactly the files the frontend needs.

Note: `upload_large_folder` writes a resume cache to `data/.cache/huggingface/`.
"""

from huggingface_hub import HfApi

REPO_ID = "Plouc314/fishing"
REPO_TYPE = "dataset"

api = HfApi()

api.upload_large_folder(
    repo_id=REPO_ID,
    repo_type=REPO_TYPE,
    folder_path="data",  # repo paths become "parquet/..." (data/ prefix dropped)
    allow_patterns=[
        "parquet/daily_split/*.parquet",
        "parquet/zones/*.parquet",
        "parquet/timeseries_grid.parquet",
        "parquet/eez_grid.parquet",
        "parquet/eez_boundaries.geojson",
    ],
)

print("done.")
