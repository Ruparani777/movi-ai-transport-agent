import { useEffect, useState, type ReactNode } from "react";
import { Activity, BusFront, MapPinHouse, RefreshCcw } from "lucide-react";
import { api } from "@/lib/api";

type Trip = {
  trip_id: number;
  display_name: string;
  live_status: string;
  booking_status_percentage: number;
  scheduled_start: string;
};

type Deployment = {
  deployment_id: number;
  trip_id: number;
  vehicle_id: number;
  driver_id: number;
  assigned_at: string;
};

type Vehicle = {
  vehicle_id: number;
  license_plate: string;
  capacity: number;
  type: string;
  is_active: boolean;
};

export const BusDashboard = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tripsRes, deploymentsRes, vehiclesRes] = await Promise.all([
        api.getTrips(),
        api.getDeployments(),
        api.getVehicles()
      ]);
      setTrips(tripsRes.data);
      setDeployments(deploymentsRes.data);
      setVehicles(vehiclesRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Live Trips Overview</h2>
            <p className="text-sm text-slate-500">Monitor booking and deployment status at a glance</p>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:border-brand-200 hover:text-brand-500"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4">
          <MetricCard
            icon={<Activity className="h-5 w-5 text-brand-500" />}
            label="Live Trips"
            value={trips.filter((trip) => trip.live_status === "Live").length}
            helper="Out of total scheduled today"
          />
          <MetricCard
            icon={<BusFront className="h-5 w-5 text-brand-500" />}
            label="Vehicles Assigned"
            value={deployments.length}
            helper="Includes shared deployments"
          />
          <MetricCard
            icon={<MapPinHouse className="h-5 w-5 text-brand-500" />}
            label="Fleet Utilization"
            value={`${vehicles.filter((v) => v.is_active).length}/${vehicles.length}`}
            helper="Active vs total vehicles"
          />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Trips & Deployments</h3>
          <span className="text-xs font-medium uppercase tracking-wide text-brand-500">
            Context-aware view
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Trip</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Scheduled Start</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Loading latest operations…
                  </td>
                </tr>
              ) : (
                trips.map((trip) => {
                  const deployment = deployments.find((d) => d.trip_id === trip.trip_id);
                  const vehicle = vehicles.find((v) => v.vehicle_id === deployment?.vehicle_id);
                  return (
                    <tr key={trip.trip_id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">{trip.display_name}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={trip.live_status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-slate-200">
                            <div
                              className="h-2 rounded-full bg-brand-500"
                              style={{ width: `${trip.booking_status_percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">
                            {trip.booking_status_percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {vehicle ? (
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {vehicle.license_plate}
                            </p>
                            <p className="text-xs text-slate-500">
                              {vehicle.type} · {vehicle.capacity} seats
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-500">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {deployment ? (
                          <span className="text-sm text-slate-600">Driver #{deployment.driver_id}</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(trip.scheduled_start).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const color =
    status === "Live"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Scheduled"
        ? "bg-sky-100 text-sky-700"
        : "bg-slate-200 text-slate-600";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
      {status}
    </span>
  );
};

const MetricCard = ({
  icon,
  label,
  value,
  helper
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  helper: string;
}) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-xl font-semibold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500">{helper}</p>
      </div>
    </div>
  </div>
);

