import { Gauge, Layers3, Upload, WandSparkles } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", icon: Gauge, path: "/dashboard" },
  { label: "Projects", icon: Layers3, path: "/projects" },
  { label: "Upload", icon: Upload, path: "/upload" },
  { label: "AI Suggestions", icon: WandSparkles, path: "/suggestions" },
];

export const Sidebar = () => {
  return (
    <aside className="hidden w-64 border-r border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400 md:block">
      <nav className="space-y-1">
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              [
                "flex items-center gap-2 rounded-lg px-3 py-2 transition",
                isActive ? "bg-slate-800 text-white" : "hover:bg-slate-800/60",
              ].join(" ")
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
