import datetime
from pydantic import BaseModel, Field


class DailyParams(BaseModel):
    date: datetime.date
    flag: str | None = None
    geartype: str | None = None
    resolution: float = Field(default=0.08, gt=0, le=0.512)
    lat_min: float = Field(default=-90.0, ge=-90, le=90)
    lat_max: float = Field(default=90.0, ge=-90, le=90)
    lon_min: float = Field(default=-180.0, ge=-180, le=180)
    lon_max: float = Field(default=180.0, ge=-180, le=180)


class RangeParams(BaseModel):
    date_start: datetime.date
    date_end: datetime.date
    flag: str | None = None
    geartype: str | None = None
    resolution: float = Field(default=0.08, gt=0, le=0.512)
    lat_min: float = Field(default=-90.0, ge=-90, le=90)
    lat_max: float = Field(default=90.0, ge=-90, le=90)
    lon_min: float = Field(default=-180.0, ge=-180, le=180)
    lon_max: float = Field(default=180.0, ge=-180, le=180)
