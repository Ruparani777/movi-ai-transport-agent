"""
Tools for the MoviAgent - provides DB-backed utilities.
Imports are deferred inside methods to avoid circular import issues.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlmodel import Session


class MoviTools:
    """Collection of DB-backed helper utilities the agent can call."""

    def __init__(self, session: Session):
        self.session = session

    # Helper to get crud module
    def _get_crud(self):
        from backend.app import crud
        return crud

    # Helper to get models
    def _get_models(self):
        from backend.app.models import DailyTrip, Deployment, Route, Stop, Vehicle
        return {"DailyTrip": DailyTrip, "Deployment": Deployment, "Route": Route, "Stop": Stop, "Vehicle": Vehicle}

    # --- Static data --------------------------------------------------------
    def list_stops(self) -> List[Dict]:
        crud = self._get_crud()
        return [stop.model_dump() for stop in crud.list_stops(self.session)]

    def create_stop(self, name: str, latitude: float, longitude: float) -> Dict:
        crud = self._get_crud()
        stop = crud.create_stop(self.session, name, latitude, longitude)
        return stop.model_dump()

    def list_paths(self) -> List[Dict]:
        crud = self._get_crud()
        paths = crud.list_paths(self.session)
        return [
            {
                "path_id": path.path_id,
                "path_name": path.path_name,
                "ordered_stop_ids": [int(pid) for pid in path.ordered_stop_ids.split(",") if pid],
            }
            for path in paths
        ]

    def list_routes(self) -> List[Dict]:
        crud = self._get_crud()
        routes = crud.list_routes(self.session)
        return [route.model_dump() for route in routes]

    def list_routes_using_path(self, path_name: str) -> List[Dict]:
        crud = self._get_crud()
        path = crud.get_path_by_name(self.session, path_name)
        if not path:
            return []
        routes = crud.list_routes_using_path(self.session, path.path_id)
        return [route.model_dump() for route in routes]

    def list_stops_for_path(self, path_name: str) -> List[Dict]:
        crud = self._get_crud()
        models = self._get_models()
        Stop = models["Stop"]
        path = crud.get_path_by_name(self.session, path_name)
        if not path:
            return []
        stop_ids = [int(pid) for pid in path.ordered_stop_ids.split(",") if pid]
        stops = []
        for stop_id in stop_ids:
            stop = self.session.get(Stop, stop_id)
            if stop:
                stops.append(stop.model_dump())
        return stops

    def create_path(self, name: str, stop_ids: List[int]) -> Dict:
        crud = self._get_crud()
        path = crud.create_path(self.session, name, stop_ids)
        return {
            "path_id": path.path_id,
            "path_name": path.path_name,
            "ordered_stop_ids": stop_ids,
        }

    def create_route(self, **kwargs: Any) -> Dict:
        crud = self._get_crud()
        route = crud.create_route(self.session, **kwargs)
        return route.model_dump()

    def update_route_status(self, route_id: int, status: str) -> Optional[Dict]:
        crud = self._get_crud()
        route = crud.update_route_status(self.session, route_id, status)
        return route.model_dump() if route else None

    # --- Dynamic data -------------------------------------------------------
    def list_daily_trips(self) -> List[Dict]:
        crud = self._get_crud()
        return [trip.model_dump() for trip in crud.list_daily_trips(self.session)]

    def get_trip(self, trip_name: str) -> Optional[Any]:
        crud = self._get_crud()
        return crud.get_trip_by_name(self.session, trip_name)

    def get_trip_status(self, trip_name: str) -> Optional[str]:
        crud = self._get_crud()
        return crud.get_trip_status(self.session, trip_name)

    def list_deployments(self) -> List[Dict]:
        crud = self._get_crud()
        return [deployment.model_dump() for deployment in crud.list_deployments(self.session)]

    def assign_vehicle_to_trip(self, trip_id: int, vehicle_id: int, driver_id: int) -> Dict:
        crud = self._get_crud()
        deployment = crud.assign_vehicle_to_trip(self.session, trip_id, vehicle_id, driver_id)
        return deployment.model_dump()

    def remove_vehicle_from_trip(self, trip_id: int) -> bool:
        crud = self._get_crud()
        return crud.remove_vehicle_from_trip(self.session, trip_id)

    def list_vehicles(self) -> List[Dict]:
        crud = self._get_crud()
        return [vehicle.model_dump() for vehicle in crud.list_vehicles(self.session)]

    def list_unassigned_vehicles(self) -> List[Dict]:
        crud = self._get_crud()
        return [vehicle.model_dump() for vehicle in crud.list_unassigned_vehicles(self.session)]

    def list_available_drivers(self) -> List[Dict]:
        crud = self._get_crud()
        return [driver.model_dump() for driver in crud.list_available_drivers(self.session)]

