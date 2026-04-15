import io
from typing import Annotated
import datetime

import pyarrow.ipc as ipc
from fastapi import APIRouter, Query
from fastapi.responses import Response

from backend.db import Database
from backend.schemas import DailyParams, RangeParams

router = APIRouter()

ARROW_MEDIA_TYPE = "application/vnd.apache.arrow.stream"


@router.get("/daily")
def get_daily(params: Annotated[DailyParams, Query()]) -> Response:
    table = Database.query_daily(
        date=params.date,
        resolution=params.resolution,
        flag=params.flag,
        geartype=params.geartype,
        lat_min=params.lat_min,
        lat_max=params.lat_max,
        lon_min=params.lon_min,
        lon_max=params.lon_max,
    )

    sink = io.BytesIO()
    with ipc.new_stream(sink, table.schema) as writer:
        writer.write_table(table)

    payload = sink.getvalue()
    print(f"[daily] date={params.date} res={params.resolution} rows={table.num_rows} payload={len(payload)/1e6:.2f}MB")

    return Response(content=payload, media_type=ARROW_MEDIA_TYPE)


@router.get("/daily/range")
def get_daily_range(params: Annotated[RangeParams, Query()]) -> Response:
    table = Database.query_range(
        date_start=params.date_start,
        date_end=params.date_end,
        resolution=params.resolution,
        flag=params.flag,
        geartype=params.geartype,
        lat_min=params.lat_min,
        lat_max=params.lat_max,
        lon_min=params.lon_min,
        lon_max=params.lon_max,
    )

    sink = io.BytesIO()
    with ipc.new_stream(sink, table.schema) as writer:
        writer.write_table(table)

    payload = sink.getvalue()
    print(f"[range] {params.date_start}..{params.date_end} res={params.resolution} rows={table.num_rows} payload={len(payload)/1e6:.2f}MB")

    return Response(content=payload, media_type=ARROW_MEDIA_TYPE)


@router.get("/chart")
def get_chart(
    date: str = Query(...),
    west: float = Query(...),
    east: float = Query(...),
    south: float = Query(...),
    north: float = Query(...),
) -> dict:
    return Database.query_chart(
        date=datetime.date.fromisoformat(date),
        west=west,
        east=east,
        south=south,
        north=north,
    )


@router.get("/chart/illegal-fishing")
def get_illegal_fishing_chart(
    date: str = Query(...),
    west: float = Query(...),
    east: float = Query(...),
    south: float = Query(...),
    north: float = Query(...),
) -> dict:
    return Database.query_illegal_fishing_chart(
        date=datetime.date.fromisoformat(date),
        west=west,
        east=east,
        south=south,
        north=north,
    )


@router.get("/chart/timeseries")
def get_timeseries_chart(
    west: float = Query(...),
    east: float = Query(...),
    south: float = Query(...),
    north: float = Query(...),
) -> dict:
    return Database.query_timeseries_chart(
        west=west,
        east=east,
        south=south,
        north=north,
    )


@router.get("/meta")
def get_meta() -> dict:
    return Database.query_meta()