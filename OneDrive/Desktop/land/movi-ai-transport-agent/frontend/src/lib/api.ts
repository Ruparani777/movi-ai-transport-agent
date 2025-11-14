import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json"
  }
});

// Mock data for demo (when backend is not running)
const MOCK_TRIPS = [
  { trip_id: 1, display_name: "Route 101 - Campus Loop", live_status: "Live", booking_status_percentage: 85, scheduled_start: "2025-11-14T08:00:00" },
  { trip_id: 2, display_name: "Route 102 - Downtown Express", live_status: "Scheduled", booking_status_percentage: 45, scheduled_start: "2025-11-14T09:30:00" },
  { trip_id: 3, display_name: "Route 103 - Airport Shuttle", live_status: "Live", booking_status_percentage: 92, scheduled_start: "2025-11-14T10:00:00" },
  { trip_id: 4, display_name: "Route 104 - Station Connector", live_status: "Scheduled", booking_status_percentage: 28, scheduled_start: "2025-11-14T14:00:00" },
];

const MOCK_DEPLOYMENTS = [
  { deployment_id: 1, trip_id: 1, vehicle_id: 1, driver_id: 101, assigned_at: "2025-11-14T07:45:00" },
  { deployment_id: 2, trip_id: 2, vehicle_id: 2, driver_id: 102, assigned_at: "2025-11-14T09:00:00" },
  { deployment_id: 3, trip_id: 3, vehicle_id: 3, driver_id: 103, assigned_at: "2025-11-14T09:45:00" },
];

const MOCK_VEHICLES = [
  { vehicle_id: 1, license_plate: "MV-001", capacity: 50, type: "Coach", is_active: true },
  { vehicle_id: 2, license_plate: "MV-002", capacity: 50, type: "Coach", is_active: true },
  { vehicle_id: 3, license_plate: "MV-003", capacity: 35, type: "Van", is_active: true },
  { vehicle_id: 4, license_plate: "MV-004", capacity: 35, type: "Van", is_active: false },
];

const MOCK_STOPS = [
  { stop_id: "S-001", name: "Campus Gate", location: "North Campus" },
  { stop_id: "S-002", name: "Library", location: "Central Campus" },
  { stop_id: "S-003", name: "Student Center", location: "West Campus" },
];

const MOCK_PATHS = [
  { path_id: "P-001", name: "North Loop", stops: ["S-001", "S-002"] },
  { path_id: "P-002", name: "Central Route", stops: ["S-002", "S-003"] },
];

const MOCK_ROUTES = [
  { route_id: "R-101", name: "Campus Loop", path_id: "P-001", status: "active" },
  { route_id: "R-102", name: "Downtown Express", path_id: "P-002", status: "active" },
];

const MOCK_DRIVERS = [
  { driver_id: 101, name: "John Smith", status: "available" },
  { driver_id: 102, name: "Sarah Johnson", status: "on_trip" },
  { driver_id: 103, name: "Mike Chen", status: "available" },
];

// Helper to check if backend is available
const isMockMode = () => {
  const mockMode = localStorage.getItem("MOVI_MOCK_MODE") !== "false";
  return mockMode;
};

// Wrapper to try real API first, fall back to mock on error
const tryApi = async <T,>(
  apiCall: () => Promise<{ data: T }>,
  mockData: T
): Promise<{ data: T }> => {
  if (!isMockMode()) {
    try {
      return await apiCall();
    } catch (error) {
      console.warn("API call failed, switching to mock mode:", error);
      localStorage.setItem("MOVI_MOCK_MODE", "true");
      return { data: mockData };
    }
  }
  return { data: mockData };
};

export const api = {
  async getStops() {
    return tryApi(() => client.get("/stops"), MOCK_STOPS);
  },
  async getPaths() {
    return tryApi(() => client.get("/paths"), MOCK_PATHS);
  },
  async getRoutes() {
    return tryApi(() => client.get("/routes"), MOCK_ROUTES);
  },
  async getTrips() {
    return tryApi(() => client.get("/trips"), MOCK_TRIPS);
  },
  async getDeployments() {
    return tryApi(() => client.get("/deployments"), MOCK_DEPLOYMENTS);
  },
  async getVehicles() {
    return tryApi(() => client.get("/vehicles"), MOCK_VEHICLES);
  },
  async getDrivers() {
    return tryApi(() => client.get("/drivers/available"), MOCK_DRIVERS);
  },
  async assignVehicle(payload: { trip_id: number; vehicle_id: number; driver_id: number }) {
    if (!isMockMode()) {
      try {
        return await client.post("/deployments/assign", payload);
      } catch (error) {
        console.warn("API call failed, switching to mock mode:", error);
        localStorage.setItem("MOVI_MOCK_MODE", "true");
      }
    }
    return { data: { success: true, message: "Vehicle assigned (mock)" } };
  },
  async removeVehicle(tripId: number) {
    if (!isMockMode()) {
      try {
        return await client.delete(`/deployments/${tripId}`);
      } catch (error) {
        console.warn("API call failed, switching to mock mode:", error);
        localStorage.setItem("MOVI_MOCK_MODE", "true");
      }
    }
    return { data: { success: true, message: "Vehicle removed (mock)" } };
  },
  async agentAction(payload: { intent: string; parameters: Record<string, unknown>; context: Record<string, unknown> }) {
    if (!isMockMode()) {
      try {
        return await client.post("/agent/action", payload);
      } catch (error) {
        console.warn("API call failed, switching to mock mode:", error);
        localStorage.setItem("MOVI_MOCK_MODE", "true");
      }
    }
    // Return mock agent response based on intent
    const mockResponses: Record<string, unknown> = {
      list_daily_trips: { action: "list_daily_trips", result: MOCK_TRIPS, status: "success (mock)" },
      list_vehicles: { action: "list_vehicles", result: MOCK_VEHICLES, status: "success (mock)" },
      list_available_drivers: { action: "list_available_drivers", result: MOCK_DRIVERS, status: "success (mock)" },
    };
    return { data: mockResponses[payload.intent] || { action: payload.intent, result: [], status: "success (mock)" } };
  },
  async uploadScreenshot(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    if (!isMockMode()) {
      try {
        return await client.post("/vision/match", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } catch (error) {
        console.warn("API call failed, switching to mock mode:", error);
        localStorage.setItem("MOVI_MOCK_MODE", "true");
      }
    }
    return { data: { match_results: [], confidence: 0, status: "success (mock)" } };
  }
};

