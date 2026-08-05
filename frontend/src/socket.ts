import { io } from "socket.io-client";

// Real-time channel for live machine_update / alert / tick events from the
// IoT simulator (backend/iot/simulator.py). See pages/Dashboard.tsx for usage.
export const socket = io("/", { autoConnect: false, transports: ["websocket"] });
