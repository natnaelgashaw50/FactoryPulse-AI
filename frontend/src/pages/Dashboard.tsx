import React, { useEffect, useState } from "react";
import client from "../api/client";
import { socket } from "../socket";
import MachineCard, { Machine } from "../components/MachineCard";
import HealthGauge from "../components/HealthGauge";
import { AlertTriangle, Activity, Zap } from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,

  PieChart,
  Pie,
  Cell,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";

const chartData = [
  { day: "Mon", health: 96 },
  { day: "Tue", health: 95 },
  { day: "Wed", health: 97 },
  { day: "Thu", health: 94 },
  { day: "Fri", health: 98 },
  { day: "Sat", health: 96 },
  { day: "Sun", health: 99 },
];

const temperatureData = [
  { day: "Mon", temp: 62 },
  { day: "Tue", temp: 65 },
  { day: "Wed", temp: 63 },
  { day: "Thu", temp: 67 },
  { day: "Fri", temp: 69 },
  { day: "Sat", temp: 66 },
  { day: "Sun", temp: 64 },
];

const energyData = [
  { day: "Mon", energy: 820 },
  { day: "Tue", energy: 790 },
  { day: "Wed", energy: 860 },
  { day: "Thu", energy: 810 },
  { day: "Fri", energy: 920 },
  { day: "Sat", energy: 880 },
  { day: "Sun", energy: 840 },
];

const aiPrediction = {
  failureRisk: 18,
  remainingLife: 142,
  confidence: 96,
};
const aiAssistant = {
  message:
    "All production lines are operating normally. CNC Mill 01 should be inspected within the next 5 days due to increasing temperature.",
};
const factoryKPI = {
  production: 1250,
  efficiency: 96,
  downtime: 12,
  energySaving: 18,
};
const alerts = [
  {
    id: 1,
    machine: "CNC Mill 01",
    message: "Temperature exceeded 82°C",
    level: "Critical",
    time: "Just now",
  },
  {
    id: 2,
    machine: "Robotic Arm A3",
    message: "High vibration detected",
    level: "High",
    time: "2 min ago",
  },
  {
    id: 3,
    machine: "Packaging Unit 5",
    message: "Maintenance required",
    level: "Medium",
    time: "8 min ago",
  },
  {
    id: 4,
    machine: "Injection Molder 4",
    message: "Oil pressure low",
    level: "High",
    time: "10 min ago",
  },
  {
    id: 5,
    machine: "Conveyor L2",
    message: "Motor overload warning",
    level: "Medium",
    time: "15 min ago",
  },
  {
    id: 6,
    machine: "Weld Station 7",
    message: "Cooling fan failure",
    level: "Critical",
    time: "20 min ago",
  },
  {
    id: 7,
    machine: "CNC Mill 02",
    message: "Unexpected spindle vibration",
    level: "High",
    time: "28 min ago",
  },
  {
    id: 8,
    machine: "Robot Cell B2",
    message: "Network communication lost",
    level: "Critical",
    time: "35 min ago",
  },
  {
    id: 9,
    machine: "Boiler Unit",
    message: "Pressure above safe limit",
    level: "Critical",
    time: "42 min ago",
  },
  {
    id: 10,
    machine: "Compressor 3",
    message: "Air leakage detected",
    level: "Medium",
    time: "55 min ago",
  },
];
const criticalAlerts = alerts.filter(a => a.level === "Critical").length;
const highAlerts = alerts.filter(a => a.level === "High").length;
const mediumAlerts = alerts.filter(a => a.level === "Medium").length;
const machineStatusData = [
  { name: "Healthy", value: 6 },
  { name: "Warning", value: 2 },
  { name: "Critical", value: 1 },
];
const COLORS = [
  "#22c55e",
  "#facc15",
  "#ef4444",
];
const gaugeData = [
  {
    name: "Efficiency",
    value: factoryKPI.efficiency,
    fill: "#06b6d4",
  },
];
type Overview = {
  total_machines: number;
  healthy_count: number;
  ai_health_score: number;
  by_status: Record<string, number>;
};
export default function Dashboard() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [toast, setToast] = useState<string | null>(null);

const [liveSensors, setLiveSensors] = useState({
  temperature: 68,
  vibration: 2.1,
  power: 845,
  pressure: 5.8,
  humidity: 48,
  oil: 82,
});
  async function load() {
    const [mRes, oRes] = await Promise.all([
      client.get("/machines"),
      client.get("/machines/overview"),
    ]);

    setMachines(mRes.data);
    setOverview(oRes.data);
  }

  useEffect(() => {
    load();

    socket.connect();

    socket.on("machine_update", () => load());

    socket.on("alert", (a: any) => {
  setToast(`${a.title}: ${a.message}`);
  setTimeout(() => setToast(null), 6000);
});

const interval = setInterval(() => {
  setLiveSensors({
    temperature: 65 + Math.floor(Math.random() * 8),
    vibration: +(1.5 + Math.random() * 2).toFixed(1),
    power: 820 + Math.floor(Math.random() * 80),
    pressure: +(5 + Math.random()).toFixed(1),
    humidity: 45 + Math.floor(Math.random() * 10),
    oil: 80 + Math.floor(Math.random() * 8),
  });
}, 2000);

return () => {
  socket.off("machine_update");
  socket.off("alert");
  socket.disconnect();
  clearInterval(interval);
};
  }, []);

  return (
    <div>

      {toast && (
        <div className="mb-4 p-3 rounded bg-panel border border-danger text-sm flex items-center gap-2">
          <AlertTriangle size={16} className="text-danger" />
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

        <div className="bg-panel border border-border rounded p-4 flex items-center gap-4">
          <HealthGauge
            value={overview?.ai_health_score ?? 0}
            label="AI Health Score"
          />
        </div>

        <StatCard
          icon={Activity}
          label="Machines Online"
          value={`${overview?.healthy_count ?? 0}/${overview?.total_machines ?? 0}`}
        />

        <StatCard
          icon={AlertTriangle}
          label="Critical"
          value={`${overview?.by_status?.critical ?? 0}`}
          danger
        />

        <StatCard
          icon={Zap}
          label="Warning"
          value={`${overview?.by_status?.warning ?? 0}`}
        />

      </div>
      {/* Machine Health Trend */}
      <div className="bg-panel border border-border rounded p-4 mb-6">
        <h2 className="text-sm font-semibold mb-4">
          Machine Health Trend
        </h2>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="health"
              stroke="#06b6d4"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Temperature Trend */}
      <div className="bg-panel border border-border rounded p-4 mb-6">
        <h2 className="text-sm font-semibold mb-4">
          Temperature Trend (°C)
        </h2>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={temperatureData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="temp"
              stroke="#f97316"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Energy Consumption */}
      <div className="bg-panel border border-border rounded p-4 mb-6">
        <h2 className="text-sm font-semibold mb-4">
          Energy Consumption (kWh)
        </h2>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={energyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="energy"
              stroke="#22c55e"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* AI Failure Prediction */}
      <div className="bg-panel border border-border rounded p-5 mb-6">
        <h2 className="text-sm font-semibold mb-4">
          AI Failure Prediction
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-panelAlt rounded p-4">
            <div className="text-xs text-muted">
              Failure Risk
            </div>

            <div className="text-3xl font-bold text-red-400 mt-2">
              {aiPrediction.failureRisk}%
            </div>
          </div>

          <div className="bg-panelAlt rounded p-4">
            <div className="text-xs text-muted">
              Remaining Useful Life
            </div>

            <div className="text-3xl font-bold text-green-400 mt-2">
              {aiPrediction.remainingLife} Days
            </div>
          </div>

          <div className="bg-panelAlt rounded p-4">
            <div className="text-xs text-muted">
              AI Confidence
            </div>

            <div className="text-3xl font-bold text-yellow-400 mt-2">
              {aiPrediction.confidence}%
            </div>
          </div>

        </div>
      </div><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

  <div className="bg-red-900/20 border border-red-500 rounded p-4">
    <div className="text-red-400 text-sm">
      Critical Alerts
    </div>

    <div className="text-4xl font-bold mt-2">
      {criticalAlerts}
    </div>
  </div>

  <div className="bg-orange-900/20 border border-orange-500 rounded p-4">
    <div className="text-orange-400 text-sm">
      High Alerts
    </div>

    <div className="text-4xl font-bold mt-2">
      {highAlerts}
    </div>
  </div>

  <div className="bg-yellow-900/20 border border-yellow-500 rounded p-4">
    <div className="text-yellow-400 text-sm">
      Medium Alerts
    </div>

    <div className="text-4xl font-bold mt-2">
      {mediumAlerts}
    </div>
  </div>

</div>
{/* Live Sensor Dashboard */}

<div className="bg-panel border border-border rounded p-5 mb-6">

  <h2 className="text-sm font-semibold mb-4">
    Live Sensor Dashboard
  </h2>

  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

    <SensorCard
      title="Temperature"
      value={`${liveSensors.temperature}°C`}
    />

    <SensorCard
      title="Vibration"
      value={`${liveSensors.vibration} mm/s`}
    />

    <SensorCard
      title="Power"
      value={`${liveSensors.power} kW`}
    />

    <SensorCard
      title="Pressure"
      value={`${liveSensors.pressure} bar`}
    />

    <SensorCard
      title="Humidity"
      value={`${liveSensors.humidity}%`}
    />

    <SensorCard
      title="Oil Level"
      value={`${liveSensors.oil}%`}
    />

  </div>

</div>
{/* Factory Performance */}
<div className="bg-panel border border-border rounded p-5 mb-6">
  <h2 className="text-sm font-semibold mb-4">
    Factory Performance
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

    <div className="bg-panelAlt rounded p-4">
      <div className="text-xs text-muted">
        Today's Production
      </div>

      <div className="text-3xl font-bold text-cyan mt-2">
        {factoryKPI.production}
      </div>

      <div className="text-xs text-muted mt-2">
        Units Produced
      </div>
    </div>

    <div className="bg-panelAlt rounded p-4">
      <div className="text-xs text-muted">
        Efficiency
      </div>

      <div className="text-3xl font-bold text-green-400 mt-2">
        {factoryKPI.efficiency}%
      </div>
    </div>

    <div className="bg-panelAlt rounded p-4">
      <div className="text-xs text-muted">
        Downtime
      </div>

      <div className="text-3xl font-bold text-red-400 mt-2">
        {factoryKPI.downtime} min
      </div>
    </div>

    <div className="bg-panelAlt rounded p-4">
      <div className="text-xs text-muted">
        Energy Saving
      </div>

      <div className="text-3xl font-bold text-yellow-400 mt-2">
        {factoryKPI.energySaving}%
      </div>
    </div>

  </div>
</div>
{/* Machine Status Overview */}

<div className="bg-panel border border-border rounded p-5 mb-6">

  <h2 className="text-sm font-semibold mb-4">
    Machine Status Overview
  </h2>

  <ResponsiveContainer width="100%" height={320}>

    <PieChart>

      <Pie
        data={machineStatusData}
        cx="50%"
        cy="50%"
        outerRadius={100}
        dataKey="value"
        label
      >
        {machineStatusData.map((entry, index) => (
          <Cell
            key={index}
            fill={COLORS[index % COLORS.length]}
          />
        ))}
      </Pie>

      <Legend />

      <Tooltip />

    </PieChart>

  </ResponsiveContainer>

</div>
{/* AI Assistant */}

<div className="bg-panel border border-border rounded p-5 mb-6">

  <h2 className="text-sm font-semibold mb-4">
    AI Factory Assistant
  </h2>

  <div className="bg-panelAlt rounded p-4">

    <div className="text-cyan font-semibold mb-2">
      AI Recommendation
    </div>

    <p className="text-sm leading-7 text-muted">
      {aiAssistant.message}
    </p>

  </div>

</div>
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

  <div className="bg-panel rounded p-4 border border-border">
    <div className="text-xs text-muted">Today's Production</div>
    <div className="text-3xl font-bold mt-2">
      {factoryKPI.production}
    </div>
  </div>

  <div className="bg-panel rounded p-4 border border-border">
    <div className="text-xs text-muted">Efficiency</div>
    <div className="text-3xl font-bold text-green-400 mt-2">
      {factoryKPI.efficiency}%
    </div>
  </div>

  <div className="bg-panel rounded p-4 border border-border">
    <div className="text-xs text-muted">Downtime</div>
    <div className="text-3xl font-bold text-red-400 mt-2">
      {factoryKPI.downtime} min
    </div>
  </div>

  <div className="bg-panel rounded p-4 border border-border">
    <div className="text-xs text-muted">Energy Saving</div>
    <div className="text-3xl font-bold text-cyan mt-2">
      {factoryKPI.energySaving}%
    </div>
  </div>

</div>
{/* Machine Status Distribution */}
<div className="bg-panel border border-border rounded p-5 mb-6">

  <h2 className="text-sm font-semibold mb-4">
    Machine Status Distribution
  </h2>

  <ResponsiveContainer width="100%" height={300}>
    <PieChart>

      <Pie
        data={machineStatusData}
        dataKey="value"
        nameKey="name"
        outerRadius={100}
        label
      >
        {machineStatusData.map((entry, index) => (
          <Cell
            key={index}
            fill={COLORS[index % COLORS.length]}
          />
        ))}
      </Pie>

      <Legend />
      <Tooltip />

    </PieChart>
  </ResponsiveContainer>

</div>
<div className="bg-panel border border-border rounded p-5 mb-6">

  <h2 className="text-sm font-semibold mb-4">
    Machine Status Distribution
  </h2>

  <ResponsiveContainer width="100%" height={320}>

    <PieChart>

      <Pie
        data={machineStatusData}
        dataKey="value"
        nameKey="name"
        outerRadius={110}
        label
      >
        {machineStatusData.map((entry, index) => (
          <Cell
            key={index}
            fill={COLORS[index]}
          />
        ))}
      </Pie>

      <Tooltip />

      <Legend />

    </PieChart>

  </ResponsiveContainer>

</div>
      {/* Recent Alerts */}
      <div className="bg-panel border border-border rounded p-5 mb-6">
        <h2 className="text-sm font-semibold mb-4">
          Recent Alerts
        </h2>

        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex justify-between items-center border border-border rounded p-3"
            >
              <div>
                <div className="font-semibold">
                  {alert.machine}
                </div>

                <div className="text-xs text-muted">
                  {alert.message}
                </div>
              </div>

              <div className="text-right">
                <div
  className={
    alert.level === "Critical"
      ? "text-red-500 font-bold"
      : alert.level === "High"
      ? "text-orange-500 font-bold"
      : "text-yellow-400 font-bold"
  }
>
  {alert.level}
</div>

                <div className="text-xs text-muted">
                  {alert.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* LIVE MACHINE STATUS */}
      <h2 className="text-sm font-semibold text-muted mb-3">
        LIVE MACHINE STATUS
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {machines.map((m) => (
          <MachineCard key={m.id} m={m} />
        ))}
      </div>

    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  danger,
}: {
  icon: any;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="bg-panel border border-border rounded p-4 flex items-center gap-3">
      <Icon
        size={22}
        className={danger ? "text-danger" : "text-cyan"}
      />

      <div>
        <div className="text-xl font-bold">
          {value}
        </div>

        <div className="text-[11px] text-muted">
          {label}
        </div>
      </div>
    </div>
  );
}
function SensorCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-panelAlt rounded-lg p-4 text-center border border-border">
      <div className="text-xs text-muted mb-2">
        {title}
      </div>

      <div className="text-2xl font-bold text-cyan">
        {value}
      </div>
    </div>
  );
}