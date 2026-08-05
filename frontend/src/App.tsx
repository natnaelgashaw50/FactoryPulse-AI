import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Machines from "./pages/Machines";
import MachineDetail from "./pages/MachineDetail";
import Maintenance from "./pages/Maintenance";
import Inventory from "./pages/Inventory";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import ChatAssistant from "./pages/ChatAssistant";
import DigitalTwin from "./pages/DigitalTwin";
import Unauthorized from "./pages/Unauthorized";

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen">
        <Topbar title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
<Route
  path="/unauthorized"
  element={<Unauthorized />}
/>
      <Route path="/" element={<ProtectedRoute><Shell title="Factory Overview"><Dashboard /></Shell></ProtectedRoute>} />
    <Route
  path="/machines"
  element={
    <ProtectedRoute roles={["Admin", "Engineer"]}>
      <Shell title="Machines">
        <Machines />
      </Shell>
    </ProtectedRoute>
  }
/>
      <Route path="/machines/:id" element={<ProtectedRoute><Shell title="Machine Detail"><MachineDetail /></Shell></ProtectedRoute>} />
     <Route
  path="/maintenance"
  element={
    <ProtectedRoute roles={["Admin", "Engineer"]}>
      <Shell title="Maintenance Scheduler">
        <Maintenance />
      </Shell>
    </ProtectedRoute>
  }
/>
<Route
  path="/inventory"
  element={
    <ProtectedRoute roles={["Admin"]}>
      <Shell title="Inventory">
        <Inventory />
      </Shell>
    </ProtectedRoute>
  }
/>
      <Route path="/alerts" element={<ProtectedRoute><Shell title="Alerts"><Alerts /></Shell></ProtectedRoute>} />
      <Route
  path="/reports"
  element={
    <ProtectedRoute roles={["Admin", "Manager"]}>
      <Shell title="Reports">
        <Reports />
      </Shell>
    </ProtectedRoute>
  }
/>
      <Route path="/assistant" element={<ProtectedRoute><Shell title="AI Chat Assistant"><ChatAssistant /></Shell></ProtectedRoute>} />
      <Route
  path="/digital-twin"
  element={
    <ProtectedRoute roles={["Admin", "Engineer"]}>
      <Shell title="Digital Twin">
        <DigitalTwin />
      </Shell>
    </ProtectedRoute>
  }
/>
    </Routes>
  );
}
