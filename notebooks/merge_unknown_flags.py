"""
One-off: collapse UNKNOWN-<ISO> flags into <ISO> in the daily_split parquet files.

GFW assigns flag UNKNOWN to MMSI with invalid MIDs; if such an MMSI spends >50%
of its fishing hours in a single EEZ it becomes UNKNOWN-<ISO> (see
README-known-issues-v3.txt). Per GFW's own docs this activity most likely belongs
to <ISO>-flagged vessels broadcasting an incorrect MID, so we merge it into <ISO>.

Bare UNKNOWN (no EEZ majority) is left as-is.

Rewrites data/parquet/daily_split/*.parquet in place.
"""
from pathlib import Path
import os
import duckdb

DAILY_SPLIT_DIR = Path("../data/parquet/daily_split")

con = duckdb.connect()
files = sorted(DAILY_SPLIT_DIR.glob("fleet-daily-*.parquet"))
print(f"Rewriting {len(files)} files...")

for i, f in enumerate(files):
    tmp = f.with_suffix(".parquet.tmp")
    con.execute(f"""
        COPY (
            SELECT
                cell_ll_lat,
                cell_ll_lon,
                CASE WHEN flag LIKE 'UNKNOWN-_%' THEN flag[9:] ELSE flag END AS flag,
                geartype,
                fishing_hours,
                mmsi_present
            FROM read_parquet('{f.as_posix()}')
            ORDER BY cell_ll_lat, cell_ll_lon
        ) TO '{tmp.as_posix()}'
        (FORMAT PARQUET, COMPRESSION SNAPPY, ROW_GROUP_SIZE 10000)
    """)
    os.replace(tmp, f)
    if (i + 1) % 200 == 0:
        print(f"  {i + 1}/{len(files)}")

print("Done.")
