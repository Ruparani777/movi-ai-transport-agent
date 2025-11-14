from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class StopBase(BaseModel):
    name: str
    latitude: float
    longitude: float


class StopCreate(StopBase):
    pass


class StopRead(StopBase):
    stop_id: int
    created_at: datetime


class PathBase(BaseModel):
    path_name: str
    ordered_stop_ids: List[int]


class PathCreate(PathBase):
    pass


class PathRead(PathBase):
    path_id: int


class RouteBase(BaseModel):
    path_id: int
    route_display_name: str
    shift_time: str
    direction: str
    start_point: str
    end_point: str
    status: str


class RouteCreate(RouteBase):
    pass


class RouteUpdateStatus(BaseModel):
    status: str


class RouteRead(RouteBase):
    route_id: int


class VehicleRead(BaseModel):
    vehicle_id: int
    license_plate: str
    type: str
    capacity: int
    is_active: bool


class DriverRead(BaseModel):
    driver_id: int
    name: str
    phone_number: str
    is_available: bool


class DailyTripRead(BaseModel):
    trip_id: int
    route_id: int
    display_name: str
    booking_status_percentage: int
    live_status: str
    scheduled_start: datetime


class DeploymentRead(BaseModel):
    deployment_id: int
    trip_id: int
    vehicle_id: int
    driver_id: int
    assigned_at: datetime


class AssignVehicleRequest(BaseModel):
    trip_id: int
    vehicle_id: int
    driver_id: int


class ConsequenceCheckResult(BaseModel):
    requires_confirmation: bool
    reason: Optional[str] = None


class AgentActionRequest(BaseModel):
    intent: str
    parameters: dict
    context: dict


class AgentActionResponse(BaseModel):
    message: str
    consequence: Optional[ConsequenceCheckResult] = None
    data: Optional[dict] = None

