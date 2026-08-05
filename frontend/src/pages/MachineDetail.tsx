import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import SensorChart, { Point } from "../components/SensorChart";
import HealthGauge from "../components/HealthGauge";

type Sensor = { id: number; type: string; unit: string; min_safe: number; max_safe: number };
type MachineT = { id: number; name: string; type: string; zone: string; status: string; health_score: number; running_hours: number };

export default function MachineDetail() {
  const { id } = useParams();
  const [machine, setMachine] = useState<MachineT | null>(null);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<number | null>(null);
  const [readings, setReadings] = useState<Point[]>([]);

  useEffect(() => {
    client.get(`/machines/${id}`).then((r) => setMachine(r.data));
    client.get(`/machines/${id}/sensors`).then((r) => {
      setSensors(r.data);
      if (r.data.length) setSelectedSensor(r.data[0].id);
    });
  }, [id]);

  useEffect(() => {
    if (!selectedSensor) return;
    const load = () => client.get(`/sensors/${selectedSensor}/readings`).then((r) => setReadings(r.data));
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [selectedSensor]);

  if (!machine) return <div className="text-muted text-sm">Loading…</div>;
  const sensor = sensors.find((s) => s.id === selectedSensor);

  return (
    <div>
      <div className="flex items-center gap-6 mb-6">
        <HealthGauge value={machine.health_score} label="Health Score" />
        <div>
          <div className="text-lg font-bold">{machine.name}</div>
          <div className="text-sm text-muted">{machine.type} • {machine.zone} • {machine.running_hours.toFixed(0)}h runtime</div>
          <div className="text-xs uppercase mt-1 text-cyan">{machine.status}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {sensors.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSensor(s.id)}
            className={`px-3 py-1.5 rounded text-xs border ${selectedSensor === s.id ? "bg-panelAlt border-cyan text-cyan" : "border-border text-muted"}`}
          >
            {s.type}
          </button>
        ))}
      </div>

      <div className="bg-panel border border-border rounded p-4">
        <SensorChart data={readings} unit={sensor?.unit ?? ""} />
      </div>
    </div>
  );
}
