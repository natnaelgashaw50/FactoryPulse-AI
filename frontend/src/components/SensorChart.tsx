import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export type Point = { recorded_at: string; value: number };

export default function SensorChart({ data, unit }: { data: Point[]; unit: string }) {
  const formatted = data.map((d) => ({ ...d, t: new Date(d.recorded_at).toLocaleTimeString() }));
  return (
    <div style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted}>
          <CartesianGrid stroke="#1A222B" vertical={false} />
          <XAxis dataKey="t" tick={{ fill: "#4E5A67", fontSize: 10 }} />
          <YAxis tick={{ fill: "#4E5A67", fontSize: 10 }} unit={unit} width={40} />
          <Tooltip contentStyle={{ background: "#161D25", border: "1px solid #232B35", fontSize: 12 }} />
          <Line type="monotone" dataKey="value" stroke="#46D7C7" dot={false} strokeWidth={2} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
