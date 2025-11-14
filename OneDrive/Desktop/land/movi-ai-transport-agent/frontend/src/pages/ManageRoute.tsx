import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus } from "lucide-react";

type Stop = {
  stop_id: number;
  name: string;
  latitude: number;
  longitude: number;
};

type Path = {
  path_id: number;
  path_name: string;
  ordered_stop_ids: number[];
};

type Route = {
  route_id: number;
  route_display_name: string;
  shift_time: string;
  direction: string;
  start_point: string;
  end_point: string;
  status: string;
};

export const ManageRoute = () => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [form, setForm] = useState({ name: "", latitude: "", longitude: "" });

  const refresh = async () => {
    const [stopsRes, pathsRes, routesRes] = await Promise.all([
      api.getStops(),
      api.getPaths(),
      api.getRoutes()
    ]);
    setStops(stopsRes.data);
    setPaths(pathsRes.data);
    setRoutes(routesRes.data);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreateStop = async (event: FormEvent) => {
    event.preventDefault();
    await api.agentAction({
      intent: "create_stop",
      parameters: {
        name: form.name,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude)
      },
      context: { currentPage: "manageRoute" }
    });
    setForm({ name: "", latitude: "", longitude: "" });
    await refresh();
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Static Asset Management</h2>
            <p className="text-sm text-slate-500">
              Configure stops, paths and routes that power daily deployments
            </p>
          </div>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-600">
            Manage Route
          </span>
        </div>

        <div className="mt-6 grid grid-cols-[320px,1fr] gap-6">
          <form
            onSubmit={handleCreateStop}
            className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <h3 className="text-sm font-semibold text-slate-700">Add New Stop</h3>
            <p className="text-xs text-slate-500">
              Stops become building blocks for paths and routes. Assistant can also create them on demand.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">
                Stop Name
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs font-medium text-slate-500">
                  Latitude
                  <input
                    type="number"
                    step="0.0001"
                    value={form.latitude}
                    onChange={(event) => setForm((prev) => ({ ...prev, latitude: event.target.value }))}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
                  />
                </label>
                <label className="text-xs font-medium text-slate-500">
                  Longitude
                  <input
                    type="number"
                    step="0.0001"
                    value={form.longitude}
                    onChange={(event) => setForm((prev) => ({ ...prev, longitude: event.target.value }))}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
                  />
                </label>
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" />
              Create Stop
            </button>
          </form>

          <div className="space-y-4">
            <DataCard title="Stops" description="All registered pickup points">
              <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Lat</th>
                      <th className="px-3 py-2">Lng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stops.map((stop) => (
                      <tr key={stop.stop_id}>
                        <td className="px-3 py-2 text-sm text-slate-600">{stop.name}</td>
                        <td className="px-3 py-2 text-xs text-slate-400">{stop.latitude.toFixed(4)}</td>
                        <td className="px-3 py-2 text-xs text-slate-400">{stop.longitude.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DataCard>

            <DataCard title="Paths" description="Sequences of stops with coverage hints">
              <div className="space-y-3">
                {paths.map((path) => (
                  <div key={path.path_id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-700">{path.path_name}</p>
                      <span className="text-xs text-slate-400">{path.ordered_stop_ids.length} stops</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {path.ordered_stop_ids
                        .map((id) => stops.find((stop) => stop.stop_id === id)?.name ?? `Stop ${id}`)
                        .join(" → ")}
                    </p>
                  </div>
                ))}
              </div>
            </DataCard>

            <DataCard title="Routes" description="Operational routes built on paths">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Route</th>
                      <th className="px-3 py-2">Shift</th>
                      <th className="px-3 py-2">Direction</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {routes.map((route) => (
                      <tr key={route.route_id}>
                        <td className="px-3 py-2 text-sm text-slate-600">{route.route_display_name}</td>
                        <td className="px-3 py-2 text-xs text-slate-400">{route.shift_time}</td>
                        <td className="px-3 py-2 text-xs text-slate-400">{route.direction}</td>
                        <td className="px-3 py-2">
                          <StatusPill status={route.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DataCard>
          </div>
        </div>
      </section>
    </div>
  );
};

const DataCard = ({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-2">
      <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
    {children}
  </div>
);

const StatusPill = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    Live: "bg-emerald-100 text-emerald-700",
    Scheduled: "bg-sky-100 text-sky-700",
    Inactive: "bg-slate-200 text-slate-600"
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${variants[status] ?? "bg-slate-200 text-slate-600"}`}>
      {status}
    </span>
  );
};

