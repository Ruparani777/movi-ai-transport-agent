from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import List

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from . import crud
from .database import get_session, init_db
from .dependencies import session_dependency
from .schemas import (
    AgentActionRequest,
    AgentActionResponse,
    AssignVehicleRequest,
    ConsequenceCheckResult,
    DailyTripRead,
    DeploymentRead,
    DriverRead,
    PathCreate,
    PathRead,
    RouteCreate,
    RouteRead,
    RouteUpdateStatus,
    StopCreate,
    StopRead,
    VehicleRead,
)

# ✅ Ensure Python can find the project root (for langgraph_agent imports)
ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))


# -------------------------------------------------------------------
# ✅ FastAPI application setup
# -------------------------------------------------------------------
app = FastAPI(title="Movi Backend API", version="0.1.0")

# Enable CORS so the frontend (React) can access the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------------
# ✅ Startup event – initialize and seed DB
# -------------------------------------------------------------------
@app.on_event("startup")
def on_startup() -> None:
    """Initialize the database and seed with sample data."""
    # Database initialization temporarily disabled
    # init_db()
    pass


# -------------------------------------------------------------------
# 🚌 Stops Endpoints
# -------------------------------------------------------------------
@app.get("/stops", response_model=List[StopRead])
def list_stops(session: Session = Depends(session_dependency)) -> List[StopRead]:
    return crud.list_stops(session)


@app.post("/stops", response_model=StopRead)
def create_stop(payload: StopCreate, session: Session = Depends(session_dependency)) -> StopRead:
    return crud.create_stop(session, payload.name, payload.latitude, payload.longitude)


# -------------------------------------------------------------------
# 🗺️ Paths Endpoints
# -------------------------------------------------------------------
@app.get("/paths", response_model=List[PathRead])
def list_paths(session: Session = Depends(session_dependency)) -> List[PathRead]:
    paths = crud.list_paths(session)
    result: List[PathRead] = []
    for path in paths:
        ordered_stop_ids = [int(pid) for pid in path.ordered_stop_ids.split(",") if pid]
        result.append(PathRead(path_id=path.path_id, path_name=path.path_name, ordered_stop_ids=ordered_stop_ids))
    return result


@app.post("/paths", response_model=PathRead)
def create_path(payload: PathCreate, session: Session = Depends(session_dependency)) -> PathRead:
    path = crud.create_path(session, payload.path_name, payload.ordered_stop_ids)
    return PathRead(path_id=path.path_id, path_name=path.path_name, ordered_stop_ids=payload.ordered_stop_ids)


# -------------------------------------------------------------------
# 🚍 Routes Endpoints
# -------------------------------------------------------------------
@app.get("/routes", response_model=List[RouteRead])
def list_routes(session: Session = Depends(session_dependency)) -> List[RouteRead]:
    return crud.list_routes(session)


@app.post("/routes", response_model=RouteRead)
def create_route(payload: RouteCreate, session: Session = Depends(session_dependency)) -> RouteRead:
    return crud.create_route(
        session,
        path_id=payload.path_id,
        route_display_name=payload.route_display_name,
        shift_time=payload.shift_time,
        direction=payload.direction,
        start_point=payload.start_point,
        end_point=payload.end_point,
        status=payload.status,
    )


@app.patch("/routes/{route_id}/status", response_model=RouteRead)
def update_route_status(route_id: int, payload: RouteUpdateStatus, session: Session = Depends(session_dependency)) -> RouteRead:
    route = crud.update_route_status(session, route_id, payload.status)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route


# -------------------------------------------------------------------
# 🚐 Vehicles & Drivers
# -------------------------------------------------------------------
@app.get("/vehicles", response_model=List[VehicleRead])
def list_vehicles(session: Session = Depends(session_dependency)) -> List[VehicleRead]:
    return crud.list_vehicles(session)


@app.get("/vehicles/unassigned", response_model=List[VehicleRead])
def list_unassigned_vehicles(session: Session = Depends(session_dependency)) -> List[VehicleRead]:
    return crud.list_unassigned_vehicles(session)


@app.get("/drivers/available", response_model=List[DriverRead])
def list_available_drivers(session: Session = Depends(session_dependency)) -> List[DriverRead]:
    return crud.list_available_drivers(session)


# -------------------------------------------------------------------
# 📅 Trips & Deployments
# -------------------------------------------------------------------
@app.get("/trips", response_model=List[DailyTripRead])
def list_trips(session: Session = Depends(session_dependency)) -> List[DailyTripRead]:
    return crud.list_daily_trips(session)


@app.get("/deployments", response_model=List[DeploymentRead])
def list_deployments(session: Session = Depends(session_dependency)) -> List[DeploymentRead]:
    return crud.list_deployments(session)


@app.post("/deployments/assign", response_model=DeploymentRead)
def assign_vehicle(payload: AssignVehicleRequest, session: Session = Depends(session_dependency)) -> DeploymentRead:
    return crud.assign_vehicle_to_trip(session, payload.trip_id, payload.vehicle_id, payload.driver_id)


@app.delete("/deployments/{trip_id}", response_model=dict)
def remove_vehicle(trip_id: int, session: Session = Depends(session_dependency)) -> dict:
    removed = crud.remove_vehicle_from_trip(session, trip_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return {"success": True}


# -------------------------------------------------------------------
# 🧠 Agent Actions
# -------------------------------------------------------------------
@app.post("/agent/action", response_model=AgentActionResponse)
def agent_action(request: AgentActionRequest, session: Session = Depends(session_dependency)) -> AgentActionResponse:
    from langgraph_agent.graph import get_agent
    
    agent = get_agent(session)
    result = agent.handle_action(request.intent, request.parameters, request.context)
    consequence = (
        ConsequenceCheckResult(**result["consequence"])
        if result.get("consequence")
        else None
    )
    return AgentActionResponse(
        message=result["message"],
        consequence=consequence,
        data=result.get("data"),
    )


# -------------------------------------------------------------------
# 🖼️ Vision Endpoint (Mock)
# -------------------------------------------------------------------
@app.post("/vision/match")
async def analyze_image(session: Session = Depends(session_dependency), file: UploadFile = File(...)) -> dict:
    """Mock endpoint that matches image names to trip names."""
    filename = Path(file.filename).stem
    normalized = re.sub(r"[^a-z0-9]+", " ", filename.lower()).strip()
    trips = crud.list_daily_trips(session)
    for trip in trips:
        trip_name_norm = re.sub(r"[^a-z0-9]+", " ", trip.display_name.lower()).strip()
        if trip_name_norm in normalized or normalized in trip_name_norm:
            return {"match": trip.display_name, "confidence": 0.75}
    return {"match": None, "confidence": 0.0}
