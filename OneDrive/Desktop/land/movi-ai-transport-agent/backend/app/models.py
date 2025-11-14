from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Stop(SQLModel, table=True):
    stop_id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    latitude: float
    longitude: float
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Path(SQLModel, table=True):
    path_id: Optional[int] = Field(default=None, primary_key=True)
    path_name: str
    ordered_stop_ids: str  # comma separated list of stop ids


class Route(SQLModel, table=True):
    route_id: Optional[int] = Field(default=None, primary_key=True)
    path_id: int = Field(foreign_key="path.path_id")
    route_display_name: str
    shift_time: str
    direction: str
    start_point: str
    end_point: str
    status: str


class Vehicle(SQLModel, table=True):
    vehicle_id: Optional[int] = Field(default=None, primary_key=True)
    license_plate: str
    type: str
    capacity: int
    is_active: bool = True


class Driver(SQLModel, table=True):
    driver_id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone_number: str
    is_available: bool = True


class DailyTrip(SQLModel, table=True):
    trip_id: Optional[int] = Field(default=None, primary_key=True)
    route_id: int = Field(foreign_key="route.route_id")
    display_name: str
    booking_status_percentage: int
    live_status: str
    scheduled_start: datetime


class Deployment(SQLModel, table=True):
    deployment_id: Optional[int] = Field(default=None, primary_key=True)
    trip_id: int = Field(foreign_key="dailytrip.trip_id")
    vehicle_id: int = Field(foreign_key="vehicle.vehicle_id")
    driver_id: int = Field(foreign_key="driver.driver_id")
    assigned_at: datetime = Field(default_factory=datetime.utcnow)

