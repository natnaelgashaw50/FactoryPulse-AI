import React, { useEffect, useState } from "react";
import client from "../api/client";
import FactoryScene, { TwinMachine } from "../three/FactoryScene";

type MachineFull = { id: number; name: string; status: string; health_score: number; position: { x: number; y: number; z: number } };

export default function DigitalTwin() {
  const [machines, setMachines] = useState<MachineFull[]>([]);
  const [selected, setSelected] = useState<MachineFull | null>(null);

  useEffect(() => {
    const load = () => client.get("/machines").then((r) => setMachines(r.data));
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, []);

  const twinMachines: TwinMachine[] = machines.map((m) => ({ id: m.id, name: m.name, status: m.status, position: m.position }));

  return (
    <div className="flex gap-4 h-[75vh]">
      <div className="flex-1 bg-panel border border-border rounded overflow-hidden relative">
        <FactoryScene machines={twinMachines} onSelect={(id) => setSelected(machines.find((m) => m.id === id) ?? null)} />
        <div className="absolute top-3 left-3 text-[10px] text-muted bg-bg/70 px-2 py-1 rounded">
          Drag to rotate • Scroll to zoom • Click a machine
        </div>
      </div>
      <div className="w-64 bg-panel border border-border rounded p-4">
        <h3 className="text-sm font-semibold mb-3">Selected asset</h3>
        {selected ? (
          <div className="text-sm">
            <div className="font-medium">{selected.name}</div>
            <div className="text-[11px] text-muted mt-1">Status: <span className="text-cyan">{selected.status}</span></div>
            <div className="text-[11px] text-muted">Health: {selected.health_score.toFixed(0)}%</div>
          </div>
        ) : (
          <div className="text-xs text-muted">Click a machine in the 3D view to see live sensor data.</div>
        )}
      </div>
    </div>
  );
}
