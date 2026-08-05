import React from "react";
import { Link } from "react-router-dom";

export type Machine = {
  id: number; name: string; type: string; zone: string;
  status: string; health_score: number; running_hours: number;
};

const STATUS_COLOR: Record<string, string> = {
  healthy: "text-cyan border-cyan/40",
  warning: "text-amber border-amber/40",
  critical: "text-danger border-danger/40",
  healing: "text-amber border-amber/40",
  offline: "text-muted border-border",
};

export default function MachineCard({ m }: { m: Machine }) {
  return (
    <Link
      to={`/machines/${m.id}`}
      className={`block p-4 rounded bg-panel border ${STATUS_COLOR[m.status] || "border-border"} hover:bg-panelAlt transition-colors`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">{m.name}</span>
        <span className={`text-[10px] uppercase ${STATUS_COLOR[m.status]?.split(" ")[0]}`}>{m.status}</span>
      </div>
      <div className="text-[11px] text-muted mb-3">{m.type} • {m.zone}</div>
      <div className="w-full h-1.5 bg-panelAlt rounded overflow-hidden">
        <div
          className="h-full bg-cyan"
          style={{ width: `${m.health_score}%`, background: m.health_score > 70 ? "#46D7C7" : m.health_score > 40 ? "#F2A93B" : "#E5484D" }}
        />
      </div>
      <div className="text-[10px] text-muted mt-1">Health {m.health_score.toFixed(0)}%</div>
    </Link>
  );
}
