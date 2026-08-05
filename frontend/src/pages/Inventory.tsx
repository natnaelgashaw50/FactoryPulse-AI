import React, { useEffect, useState } from "react";
import client from "../api/client";
import { AlertTriangle } from "lucide-react";

type Stock = { id: number; spare_part_id: number; part_name: string; quantity: number; reorder_threshold: number; reorder_suggested: boolean };

export default function Inventory() {
  const [stock, setStock] = useState<Stock[]>([]);

  function load() {
    client.get("/inventory/stock").then((r) => setStock(r.data));
  }
  useEffect(load, []);

  async function adjust(id: number, delta: number) {
    const item = stock.find((s) => s.id === id);
    if (!item) return;
    await client.patch(`/inventory/stock/${id}`, { quantity: Math.max(0, item.quantity + delta) });
    load();
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-muted mb-3">SPARE PARTS STOCK</h2>
      <div className="bg-panel border border-border rounded divide-y divide-border">
        {stock.map((s) => (
          <div key={s.id} className="p-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {s.reorder_suggested && <AlertTriangle size={14} className="text-amber" />}
              <div>
                <div className="font-medium">{s.part_name}</div>
                <div className="text-[11px] text-muted">Reorder threshold: {s.reorder_threshold}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => adjust(s.id, -1)} className="w-6 h-6 border border-border rounded hover:border-cyan">-</button>
              <span className={`w-10 text-center font-bold ${s.reorder_suggested ? "text-amber" : ""}`}>{s.quantity}</span>
              <button onClick={() => adjust(s.id, 1)} className="w-6 h-6 border border-border rounded hover:border-cyan">+</button>
              {s.reorder_suggested && <span className="text-[10px] text-amber ml-2">AUTO-ORDER SUGGESTED</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
