import React, { useEffect, useState } from "react";
import client from "../api/client";
import MachineCard, { Machine } from "../components/MachineCard";

export default function Machines() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    client.get("/machines").then((r) => setMachines(r.data));
  }, []);

  const filtered = filter === "all" ? machines : machines.filter((m) => m.status === filter);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {["all", "healthy", "warning", "critical"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded text-xs border ${filter === s ? "bg-panelAlt border-cyan text-cyan" : "border-border text-muted"}`}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((m) => (
          <MachineCard key={m.id} m={m} />
        ))}
      </div>
    </div>
  );
}
