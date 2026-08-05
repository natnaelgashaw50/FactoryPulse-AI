import React, { useEffect, useState } from "react";
import client from "../api/client";

type Task = {
  id: number; machine_id: number; technician_id: number | null;
  scheduled_at: string; duration_minutes: number; task: string; status: string;
};
type Tech = { id: number; name: string; specialty: string; available: boolean };

export default function Maintenance() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [techs, setTechs] = useState<Tech[]>([]);

  function load() {
    client.get("/maintenance").then((r) => setTasks(r.data));
    client.get("/maintenance/technicians").then((r) => setTechs(r.data));
  }
  useEffect(load, []);

  async function markComplete(id: number) {
    await client.patch(`/maintenance/${id}`, { status: "completed" });
    load();
  }

  const techName = (id: number | null) => techs.find((t) => t.id === id)?.name ?? "Unassigned";

  return (
    <div>
      <h2 className="text-sm font-semibold text-muted mb-3">SCHEDULED WORK ORDERS</h2>
      <div className="bg-panel border border-border rounded divide-y divide-border">
        {tasks.length === 0 && <div className="p-4 text-sm text-muted">No scheduled maintenance yet — tasks are created from resolved alerts.</div>}
        {tasks.map((t) => (
          <div key={t.id} className="p-4 flex items-center justify-between text-sm">
            <div>
              <div className="font-medium">{t.task}</div>
              <div className="text-[11px] text-muted">
                Machine #{t.machine_id} • {techName(t.technician_id)} • {new Date(t.scheduled_at).toLocaleString()} • {t.duration_minutes}min
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] uppercase ${t.status === "completed" ? "text-cyan" : "text-amber"}`}>{t.status}</span>
              {t.status !== "completed" && (
                <button onClick={() => markComplete(t.id)} className="text-xs px-2 py-1 border border-border rounded hover:border-cyan hover:text-cyan">
                  Mark done
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-muted mt-8 mb-3">TECHNICIANS</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {techs.map((t) => (
          <div key={t.id} className="bg-panel border border-border rounded p-3 text-sm">
            <div className="font-medium">{t.name}</div>
            <div className="text-[11px] text-muted">{t.specialty}</div>
            <div className={`text-[10px] mt-1 ${t.available ? "text-cyan" : "text-muted"}`}>{t.available ? "Available" : "Busy"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
