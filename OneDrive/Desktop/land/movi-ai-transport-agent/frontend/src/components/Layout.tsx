import { PropsWithChildren } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { MoviAssistant } from "./MoviAssistant";

const navItems = [
  { to: "/busDashboard", label: "Bus Dashboard" },
  { to: "/manageRoute", label: "Manage Route" }
];

export const Layout = ({ children }: PropsWithChildren) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-brand-600">Movi – Transport Control Center</h1>
          <p className="text-sm text-slate-500">
            Context-aware assistance for MoveInSync transport managers
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-brand-600">
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm font-medium">Movi Assistant Active</span>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-88px)] grid-cols-[280px,1fr,380px] gap-4 p-6">
        <aside className="rounded-xl bg-white p-4 shadow-card">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-500 text-white shadow"
                      : "text-slate-600 hover:bg-slate-100 hover:text-brand-600"
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-8 space-y-3 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Current Context</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="font-medium text-slate-600">Page</p>
              <p>{location.pathname === "/manageRoute" ? "manageRoute" : "busDashboard"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="font-medium text-slate-600">Persona</p>
              <p>Transport Manager</p>
            </div>
          </div>
        </aside>

        <main className="space-y-4">{children}</main>

        <MoviAssistant />
      </div>
    </div>
  );
};

