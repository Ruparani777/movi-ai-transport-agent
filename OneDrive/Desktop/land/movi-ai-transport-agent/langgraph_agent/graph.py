from __future__ import annotations

from typing import Any, Dict, Optional

from sqlmodel import Session

from .tools import MoviTools


class MoviAgent:
    """Stateful multimodal agent that orchestrates tools and applies consequence logic."""

    def __init__(self, session: Session):
        self.session = session
        self.tools = MoviTools(session)

    # ------------------------------------------------------------------
    # Main entry point: handle_action orchestrates the state machine
    # ------------------------------------------------------------------
    def handle_action(self, intent: str, parameters: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main state machine: parse → check_context → check_consequences → execute → respond.
        Returns a dict with message, data, and optional consequence.
        """
        state = {
            "intent": intent,
            "parameters": parameters,
            "context": context,
            "consequence": None,
            "data": None,
            "message": "",
        }

        # 1. Parse intent (already parsed from frontend; this is a no-op for now)
        state = self._parse_intent(state)

        # 2. Check context (validate page context, etc.)
        state = self._check_context(state)

        # 3. Check consequences (warn about risky operations)
        state = self._check_consequences(state)

        # 4. Execute action (only if no consequence or if force=True)
        state = self._execute_action(state)

        # 5. Respond (format the response)
        state = self._respond(state)

        # Return the response object as expected by the endpoint
        response = {
            "message": state.get("message", ""),
            "data": state.get("data"),
        }
        if state.get("consequence"):
            response["consequence"] = state["consequence"]

        return response

    # ------------------------------------------------------------------
    # Pipeline stages
    # ------------------------------------------------------------------
    def _parse_intent(self, state: Dict) -> Dict:
        """Parse the intent (already done on frontend; this is a placeholder)."""
        return state

    def _check_context(self, state: Dict) -> Dict:
        """Validate the context (page, user, etc.) and enrich state if needed."""
        context = state.get("context", {})
        state["context"] = context
        return state

    def _check_consequences(self, state: Dict) -> Dict:
        """Check if the action has risky consequences and set a flag."""
        intent = state["intent"]
        params = state.get("parameters", {})
        consequence = None

        if intent == "remove_vehicle_from_trip":
            trip_name = params.get("trip_name")
            if trip_name:
                trip = self.tools.get_trip(trip_name)
                if trip and trip.booking_status_percentage > 0:
                    consequence = {
                        "requires_confirmation": True,
                        "reason": f"{trip.booking_status_percentage}% of seats already booked for {trip.display_name}.",
                    }
        elif intent == "update_route_status" and params.get("status") == "Inactive":
            consequence = {
                "requires_confirmation": True,
                "reason": "Setting the route to inactive will hide it from live dashboards.",
            }

        if consequence:
            state["consequence"] = consequence

        return state

    def _execute_action(self, state: Dict) -> Dict:
        """Execute the action handler, or return a confirmation request."""
        intent = state["intent"]
        params = state.get("parameters", {})
        consequence = state.get("consequence")
        force = params.get("confirmed", False)

        # If there is a consequence and the user hasn't confirmed, ask for confirmation
        if consequence and not force:
            state["message"] = "Confirmation required before executing action."
            return state

        # Find and call the handler for this intent
        handler = getattr(self, f"_handle_{intent}", None)
        if handler is None:
            state["message"] = f"Intent '{intent}' not implemented."
            return state

        try:
            data, message = handler(params)
            state["data"] = data
            state["message"] = message
        except Exception as e:
            state["message"] = f"Error executing action: {str(e)}"
            state["data"] = None

        return state

    def _respond(self, state: Dict) -> Dict:
        """Format and return the final response."""
        return state

    # --- Intent Handlers ----------------------------------------------------
    def _handle_list_unassigned_vehicles(self, params: Dict[str, Any]):
        vehicles = self.tools.list_unassigned_vehicles()
        message = f"Found {len(vehicles)} unassigned vehicles."
        return {"vehicles": vehicles}, message

    def _handle_get_trip_status(self, params: Dict[str, Any]):
        trip_name = params.get("trip_name")
        status = self.tools.get_trip_status(trip_name)
        if status is None:
            return None, f"Trip '{trip_name}' not found."
        return {"status": status}, f"{trip_name} is currently {status}."

    def _handle_list_stops_for_path(self, params: Dict[str, Any]):
        path_name = params.get("path_name")
        stops = self.tools.list_stops_for_path(path_name)
        return {"stops": stops}, f"Path {path_name} covers {len(stops)} stops."

    def _handle_list_routes_using_path(self, params: Dict[str, Any]):
        path_name = params.get("path_name")
        routes = self.tools.list_routes_using_path(path_name)
        return {"routes": routes}, f"Found {len(routes)} routes using {path_name}."

    def _handle_assign_vehicle_to_trip(self, params: Dict[str, Any]):
        payload = self.tools.assign_vehicle_to_trip(params["trip_id"], params["vehicle_id"], params["driver_id"])
        return payload, "Vehicle assigned successfully."

    def _handle_remove_vehicle_from_trip(self, params: Dict[str, Any]):
        trip_id = params.get("trip_id")
        removed = self.tools.remove_vehicle_from_trip(trip_id)
        if removed:
            return {"removed": True}, "Vehicle removed from trip."
        return {"removed": False}, "No vehicle assignment found for that trip."

    def _handle_create_stop(self, params: Dict[str, Any]):
        stop = self.tools.create_stop(params["name"], params["latitude"], params["longitude"])
        return stop, f"Created stop {stop['name']}."

    def _handle_create_path(self, params: Dict[str, Any]):
        path = self.tools.create_path(params["name"], params["stop_ids"])
        return path, f"Created path {path['path_name']}."

    def _handle_create_route(self, params: Dict[str, Any]):
        route = self.tools.create_route(**params)
        return route, f"Route {route['route_display_name']} created."

    def _handle_update_route_status(self, params: Dict[str, Any]):
        route = self.tools.update_route_status(params["route_id"], params["status"])
        if route:
            return route, f"Route status updated to {params['status']}."
        return None, "Route not found."

    def _handle_list_daily_trips(self, params: Dict[str, Any]):
        trips = self.tools.list_daily_trips()
        return {"trips": trips}, f"Found {len(trips)} daily trips."

    def _handle_list_deployments(self, params: Dict[str, Any]):
        deployments = self.tools.list_deployments()
        return {"deployments": deployments}, f"Found {len(deployments)} deployments."

    def _handle_list_available_drivers(self, params: Dict[str, Any]):
        drivers = self.tools.list_available_drivers()
        return {"drivers": drivers}, f"Found {len(drivers)} available drivers."


def get_agent(session: Session) -> MoviAgent:
    return MoviAgent(session)

