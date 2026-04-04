import datetime
import json
import threading
import duckdb
import pyarrow as pa
from pathlib import Path

DATA_DIR = Path("data")
DAILY_PARQUET_DIR = DATA_DIR / "parquet" / "daily"
META_CACHE = DATA_DIR / "meta.json"

_local = threading.local()


class Database:
    @classmethod
    def init(cls) -> None:
        pass  # connections are created per-thread on demand

    @classmethod
    def close(cls) -> None:
        conn = getattr(_local, 'conn', None)
        if conn is not None:
            conn.close()
            _local.conn = None

    @classmethod
    def _conn(cls) -> duckdb.DuckDBPyConnection:
        if not hasattr(_local, 'conn') or _local.conn is None:
            _local.conn = duckdb.connect()
        return _local.conn

    @classmethod
    def query_daily(
        cls,
        date: datetime.date,
        resolution: float,
        flag: str | None = None,
        geartype: str | None = None,
        lat_min: float = -90.0,
        lat_max: float = 90.0,
        lon_min: float = -180.0,
        lon_max: float = 180.0,
    ) -> pa.Table:
        """Return fishing effort for a single day aggregated to the zoom level.

        Arrow schema:
            lat           float32   lower-left latitude of the grid cell (degrees)
            lon           float32   lower-left longitude of the grid cell (degrees)
            fishing_hours float32   total fishing hours in the cell
        """
        parquet_path = DAILY_PARQUET_DIR / f"fleet-daily-{date.strftime('%Y-%m')}.parquet"

        res = resolution

        conditions = ["date = ?"]
        params: list = [date.isoformat()]

        if lat_min > -90.0 or lat_max < 90.0:
            conditions.append("cell_ll_lat BETWEEN ? AND ?")
            params.extend([lat_min, lat_max])
        if lon_min > -180.0 or lon_max < 180.0:
            conditions.append("cell_ll_lon BETWEEN ? AND ?")
            params.extend([lon_min, lon_max])

        if flag is not None:
            conditions.append("flag = ?")
            params.append(flag)
        if geartype is not None:
            conditions.append("geartype = ?")
            params.append(geartype)

        where = " AND ".join(conditions)

        # Always GROUP BY: at 0.01° the values are already at that resolution so
        # ROUND is a no-op, but grouping is still needed when flag or geartype is
        # not pinned (multiple rows can share the same grid cell).
        sql = f"""
            SELECT
                (ROUND(cell_ll_lat / {res}) * {res})::FLOAT AS lat,
                (ROUND(cell_ll_lon / {res}) * {res})::FLOAT AS lon,
                SUM(fishing_hours)::FLOAT AS fishing_hours
            FROM read_parquet('{parquet_path}')
            WHERE {where}
            GROUP BY lat, lon
        """

        return cls._conn().execute(sql, params).fetch_arrow_table()
    
    @classmethod
    def query_chart(
        cls,
        date: datetime.date,
        west: float,
        east: float,
        south: float,
        north: float,
    ) -> dict:
        """
        Return the share of boats by flag inside the current viewport for one day.
        Uses mmsi_present as a proxy for number of boats.
        """
        parquet_path = DAILY_PARQUET_DIR / f"fleet-daily-{date.strftime('%Y-%m')}.parquet"

        sql = f"""
            SELECT
                flag AS label,
                SUM(mmsi_present)::DOUBLE AS value
            FROM read_parquet('{parquet_path}')
            WHERE date = ?
            AND cell_ll_lon BETWEEN ? AND ?
            AND cell_ll_lat BETWEEN ? AND ?
            AND flag IS NOT NULL
            GROUP BY flag
            HAVING SUM(mmsi_present) > 0
            ORDER BY value DESC
        """

        params = [
            date.isoformat(),
            west, east,
            south, north,
        ]

        rows = cls._conn().execute(sql, params).fetchall()

        if not rows:
            return {"data": []}

        total = sum(row[1] for row in rows)

        data = [
            {
                "label": row[0],
                "value": round(100.0 * row[1] / total, 2),
            }
            for row in rows
        ]

        return {"data": data}

    @classmethod
    def query_range(
        cls,
        date_start: datetime.date,
        date_end: datetime.date,
        resolution: float,
        flag: str | None = None,
        geartype: str | None = None,
        lat_min: float = -90.0,
        lat_max: float = 90.0,
        lon_min: float = -180.0,
        lon_max: float = 180.0,
    ) -> pa.Table:
        """Return fishing effort for a date range aggregated to the zoom level.

        Arrow schema:
            date          utf8      ISO date string (YYYY-MM-DD)
            lat           float32   lower-left latitude of the grid cell (degrees)
            lon           float32   lower-left longitude of the grid cell (degrees)
            fishing_hours float32   total fishing hours in the cell
        """
        # Collect monthly parquet files that cover the requested range.
        parquet_paths = []
        d = date_start.replace(day=1)
        while d <= date_end:
            path = DAILY_PARQUET_DIR / f"fleet-daily-{d.strftime('%Y-%m')}.parquet"
            if path.exists():
                parquet_paths.append(str(path))
            d = (d.replace(day=28) + datetime.timedelta(days=4)).replace(day=1)

        if not parquet_paths:
            return pa.table({
                "date": pa.array([], type=pa.utf8()),
                "lat": pa.array([], type=pa.float32()),
                "lon": pa.array([], type=pa.float32()),
                "fishing_hours": pa.array([], type=pa.float32()),
            })

        res = resolution
        paths_list = "[" + ", ".join(f"'{p}'" for p in parquet_paths) + "]"

        conditions = [
            "date BETWEEN ? AND ?",
            "cell_ll_lat BETWEEN ? AND ?",
            "cell_ll_lon BETWEEN ? AND ?",
        ]
        params: list = [
            date_start.isoformat(), date_end.isoformat(),
            lat_min, lat_max,
            lon_min, lon_max,
        ]

        if flag is not None:
            conditions.append("flag = ?")
            params.append(flag)
        if geartype is not None:
            conditions.append("geartype = ?")
            params.append(geartype)

        where = " AND ".join(conditions)

        sql = f"""
            SELECT
                date::VARCHAR AS date,
                (ROUND(cell_ll_lat / {res}) * {res})::FLOAT AS lat,
                (ROUND(cell_ll_lon / {res}) * {res})::FLOAT AS lon,
                SUM(fishing_hours)::FLOAT AS fishing_hours
            FROM read_parquet({paths_list})
            WHERE {where}
            GROUP BY date, lat, lon
            ORDER BY date
        """

        return cls._conn().execute(sql, params).fetch_arrow_table()

    @classmethod
    def query_meta(cls) -> dict:
        if META_CACHE.exists():
            return json.loads(META_CACHE.read_text())

        parquet_glob = str(DAILY_PARQUET_DIR / "*.parquet")

        date_min, date_max = cls._conn().execute(
            f"SELECT MIN(date)::VARCHAR, MAX(date)::VARCHAR FROM read_parquet('{parquet_glob}')"
        ).fetchone()

        flags = [
            row[0]
            for row in cls._conn().execute(
                f"SELECT DISTINCT flag FROM read_parquet('{parquet_glob}')"
                " WHERE flag IS NOT NULL ORDER BY flag"
            ).fetchall()
        ]

        geartypes = [
            row[0]
            for row in cls._conn().execute(
                f"SELECT DISTINCT geartype FROM read_parquet('{parquet_glob}')"
                " WHERE geartype IS NOT NULL ORDER BY geartype"
            ).fetchall()
        ]

        meta = {
            "date_min": date_min,
            "date_max": date_max,
            "flags": flags,
            "geartypes": geartypes,
        }

        META_CACHE.write_text(json.dumps(meta, indent=2))
        return meta
