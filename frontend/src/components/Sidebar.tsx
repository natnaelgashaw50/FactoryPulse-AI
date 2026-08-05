import React from "react";
import { useAuth } from "../context/AuthContext";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Cog, CalendarClock, Package, Bell, FileBarChart, MessageSquare, Boxes,
} from "lucide-react";

const links = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["Admin", "Engineer", "Manager"],
  },
  {
    to: "/machines",
    label: "Machines",
    icon: Cog,
    roles: ["Admin", "Engineer"],
  },
  {
    to: "/maintenance",
    label: "Maintenance",
    icon: CalendarClock,
    roles: ["Admin", "Engineer"],
  },
  {
    to: "/inventory",
    label: "Inventory",
    icon: Package,
    roles: ["Admin"],
  },
  {
    to: "/alerts",
    label: "Alerts",
    icon: Bell,
    roles: ["Admin", "Engineer", "Manager"],
  },
  {
    to: "/reports",
    label: "Reports",
    icon: FileBarChart,
    roles: ["Admin", "Manager"],
  },
  {
    to: "/assistant",
    label: "AI Assistant",
    icon: MessageSquare,
    roles: ["Admin", "Engineer", "Manager"],
  },
  {
    to: "/digital-twin",
    label: "Digital Twin",
    icon: Boxes,
    roles: ["Admin", "Engineer"],
  },
];

export default function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="w-56 shrink-0 bg-panel border-r border-border min-h-screen p-4">
      <div className="mb-8">
       <div className="text-sm font-bold tracking-wide">FactoryPulse AI</div>
        <div className="text-[10px] text-muted">Industrial Intelligence Platform</div>
      </div>
      <nav className="flex flex-col gap-1">
       {links
  .filter(link => link.roles.includes(user?.role || ""))
  .map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded text-sm ${
                isActive ? "bg-panelAlt text-cyan" : "text-muted hover:text-white"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
<div className="mt-6 border-t border-border pt-4 text-xs text-muted">
  <div><strong>User:</strong> {user?.name}</div>
  <div><strong>Role:</strong> {user?.role}</div>
</div>
      </nav>
    </aside>
  );
}
