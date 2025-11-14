from __future__ import annotations

from typing import Iterable, List, Optional

from sqlmodel import Session, select

from .models import DailyTrip, Deployment, Driver, Path, Route, Stop, Vehicle


# Stops -----------------------------------------------------------------------
def list_stops(session: Session) -> List[Stop]:
    return session.exec(select(Stop)).all()


def get_stop_by_name(session: Session, name: str) -> Optional[Stop]:
    return session.exec(select(Stop).where(Stop.name == name)).first()


def create_stop(session: Session, name: str, latitude: float, longitude: float) -> Stop:
    stop = Stop(name=name, latitude=latitude, longitude=longitude)
    session.add(stop)
    session.commit()
    session.refresh(stop)
    return stop


# Paths -----------------------------------------------------------------------
def list_paths(session: Session) -> List[Path]:
    return session.exec(select(Path)).all()


def get_path_by_name(session: Session, name: str) -> Optional[Path]:
    return session.exec(select(Path).where(Path.path_name == name)).first()


def create_path(session: Session, name: str, ordered_stop_ids: Iterable[int]) -> Path:
    stop_string = ",".join(str(stop_id) for stop_id in ordered_stop_ids)
    path = Path(path_name=name, ordered_stop_ids=stop_string)
    session.add(path)
    session.commit()
    session.refresh(path)
    return path


# Routes ----------------------------------------------------------------------
def list_routes(session: Session) -> List[Route]:
    return session.exec(select(Route)).all()


def list_routes_using_path(session: Session, path_id: int) -> List[Route]:
    return session.exec(select(Route).where(Route.path_id == path_id)).all()


def create_route(
    session: Session,
    path_id: int,
    route_display_name: str,
    shift_time: str,
    direction: str,
    start_point: str,
    end_point: str,
    status: str,
) -> Route:
    route = Route(
        path_id=path_id,
        route_display_name=route_display_name,
        shift_time=shift_time,
        direction=direction,
        start_point=start_point,
        end_point=end_point,
        status=status,
    )
    session.add(route)
    session.commit()
    session.refresh(route)
    return route


def update_route_status(session: Session, route_id: int, status: str) -> Optional[Route]:
    route = session.get(Route, route_id)
    if route is None:
        return None
    route.status = status
    session.add(route)
    session.commit()
    session.refresh(route)
    return route


# Vehicles --------------------------------------------------------------------
def list_vehicles(session: Session) -> List[Vehicle]:
    return session.exec(select(Vehicle)).all()


def list_unassigned_vehicles(session: Session) -> List[Vehicle]:
    assigned_ids = {
        deployment.vehicle_id for deployment in session.exec(select(Deployment)).all()
    }
    return [vehicle for vehicle in list_vehicles(session) if vehicle.vehicle_id not in assigned_ids]


# Drivers ---------------------------------------------------------------------
def list_available_drivers(session: Session) -> List[Driver]:
    assigned = {
        deployment.driver_id for deployment in session.exec(select(Deployment)).all()
    }
    return [driver for driver in session.exec(select(Driver)).all() if driver.driver_id not in assigned]


# Trips -----------------------------------------------------------------------
def list_daily_trips(session: Session) -> List[DailyTrip]:
    return session.exec(select(DailyTrip)).all()


def get_trip_by_name(session: Session, display_name: str) -> Optional[DailyTrip]:
    return session.exec(select(DailyTrip).where(DailyTrip.display_name == display_name)).first()


def get_trip_status(session: Session, display_name: str) -> Optional[str]:
    trip = get_trip_by_name(session, display_name)
    return trip.live_status if trip else None


# Deployments -----------------------------------------------------------------
def list_deployments(session: Session) -> List[Deployment]:
    return session.exec(select(Deployment)).all()


def assign_vehicle_to_trip(session: Session, trip_id: int, vehicle_id: int, driver_id: int) -> Deployment:
    deployment = Deployment(trip_id=trip_id, vehicle_id=vehicle_id, driver_id=driver_id)
    session.add(deployment)
    session.commit()
    session.refresh(deployment)
    return deployment


def remove_vehicle_from_trip(session: Session, trip_id: int) -> bool:
    deployment = session.exec(select(Deployment).where(Deployment.trip_id == trip_id)).first()
    if deployment is None:
        return False
    session.delete(deployment)
    session.commit()
    return True

