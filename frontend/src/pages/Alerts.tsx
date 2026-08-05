import React, { useEffect, useState } from "react";
import client from "../api/client";
import { socket } from "../socket";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

type AlertT = {
  id: number; machine_id: number; severity: string; title: string; message: string;
  cause: string; recommendation: string; estimated_minutes: number; status: string; created_at: string;
};

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertT[]>([]);

  function load() {
    client.get("/alerts").then((r) => setAlerts(r.data));
  }
  useEffect(() => {
    load();
    socket.connect();
    socket.on("alert", load);
    return () => {
      socket.off("alert", load);
    };
  }, []);

  async function resolve(id: number) {
    await client.post(`/alerts/${id}/resolve`);
    load();
  }

  const color = (sev: string) => (sev === "critical" ? "text-danger" : sev === "high" ? "text-amber" : "text-muted");

  return (
    <div className="flex flex-col gap-3">
      {alerts.length === 0 && <div className="text-sm text-muted">No alerts recorded yet.</div>}
      {alerts.map((a) => (
        <div key={a.id} className="bg-panel border border-border rounded p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className={color(a.severity)} />
              <div>
                <div className="font-semibold text-sm">{a.title} <span className="text-[10px] text-muted">• Machine #{a.machine_id}</span></div>
                <div className="text-xs text-muted mt-1">{a.message}</div>
                {a.cause && <div className="text-xs mt-2"><span className="text-muted">Cause:</span> {a.cause}</div>}
                {a.recommendation && <div className="text-xs"><span className="text-muted">Recommendation:</span> {a.recommendation}</div>}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-[10px] uppercase ${color(a.severity)}`}>{a.severity}</div>
              <div className="text-[10px] text-muted">{new Date(a.created_at).toLocaleTimeString()}</div>
              {a.status !== "resolved" ? (
                <button onClick={() => resolve(a.id)} className="mt-2 text-[11px] flex items-center gap-1 px-2 py-1 border border-border rounded hover:border-cyan hover:text-cyan">
                  <CheckCircle2 size={12} /> Resolve
                </button>
              ) : (
                <div className="mt-2 text-[10px] text-cyan">RESOLVED</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
