from __future__ import annotations

from datetime import datetime, timedelta

from sqlmodel import Session, select

from . import crud
from .models import DailyTrip, Deployment, Driver, Path, Route, Stop, Vehicle


def seed(session: Session) -> None:
    if session.exec(select(Stop)).first():
        return

    stops = [
        Stop(name="Campus Gate", latitude=12.9716, longitude=77.5946),
        Stop(name="Tech Park", latitude=12.9081, longitude=77.6476),
        Stop(name="Metro Station", latitude=12.9352, longitude=77.6245),
        Stop(name="City Center", latitude=12.9784, longitude=77.6408),
        Stop(name="Warehouse Hub", latitude=12.9901, longitude=77.5802),
    ]
    session.add_all(stops)
    session.commit()

    path_a = Path(path_name="North Loop", ordered_stop_ids="1,2,3")
    path_b = Path(path_name="South Loop", ordered_stop_ids="3,4,5")
    session.add_all([path_a, path_b])
    session.commit()

    routes = [
        Route(
            path_id=path_a.path_id,
            route_display_name="Bulk - 00:01",
            shift_time="00:01",
            direction="Outbound",
            start_point="Campus Gate",
            end_point="Tech Park",
            status="Scheduled",
        ),
        Route(
            path_id=path_b.path_id,
            route_display_name="Bulk - 08:30",
            shift_time="08:30",
            direction="Inbound",
            start_point="Warehouse Hub",
            end_point="Campus Gate",
            status="Live",
        ),
    ]
    session.add_all(routes)
    session.commit()

    vehicles = [
        Vehicle(license_plate="KA01AB1234", type="Mini Bus", capacity=25, is_active=True),
        Vehicle(license_plate="KA01AB5678", type="Coach", capacity=40, is_active=True),
        Vehicle(license_plate="KA01AB9012", type="Mini Bus", capacity=20, is_active=False),
    ]
    session.add_all(vehicles)
    session.commit()

    drivers = [
        Driver(name="Sanjay Kumar", phone_number="+91-9876543210", is_available=True),
        Driver(name="Priya Singh", phone_number="+91-9876543211", is_available=True),
        Driver(name="Arun Das", phone_number="+91-9876543212", is_available=True),
    ]
    session.add_all(drivers)
    session.commit()

    now = datetime.utcnow()
    trips = [
        DailyTrip(
            route_id=routes[0].route_id,
            display_name="Bulk - 00:01",
            booking_status_percentage=25,
            live_status="Scheduled",
            scheduled_start=now + timedelta(hours=1),
        ),
        DailyTrip(
            route_id=routes[1].route_id,
            display_name="Bulk - 08:30",
            booking_status_percentage=60,
            live_status="Live",
            scheduled_start=now + timedelta(hours=8),
        ),
    ]
    session.add_all(trips)
    session.commit()

    deployment = Deployment(
        trip_id=trips[1].trip_id, vehicle_id=vehicles[1].vehicle_id, driver_id=drivers[1].driver_id
    )
    session.add(deployment)
    session.commit()

