# Intelligent Self-Healing Factory Platform (ISHFP)

AI-monitored factory floor platform: live machine telemetry, predictive
maintenance (failure probability + Remaining Useful Life), an automated
self-healing recommendation engine, maintenance scheduling, spare-parts
inventory, an AI chat assistant, a 3D digital twin, alerting, and
PDF/Excel reporting.

## Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React + TypeScript + Vite + Tailwind CSS + Three.js |
| Backend   | Flask + Flask-SQLAlchemy + Flask-JWT-Extended + Flask-SocketIO |
| AI        | scikit-learn (RandomForest, IsolationForest) + pandas/numpy |
| Database  | PostgreSQL (SQLite fallback for local dev — zero setup) |
| Real-time | Socket.IO (machine updates, alerts) — swap in MQTT for real IoT hardware |
| Auth      | JWT, role-based (Admin, Engineer, Technician, Manager) |

## Project layout

```
ISHFP/
├── backend/
│   ├── app.py                 # Flask app factory + blueprint registration
│   ├── config.py               # env-driven config (DB, JWT, CORS, simulator cadence)
│   ├── extensions.py           # db, jwt, cors, socketio singletons
│   ├── models.py                # all 12 tables (see database/schema.sql)
│   ├── seed.py                  # demo users, machines, sensors, technicians, parts
│   ├── routes/                  # REST API blueprints, one file per domain
│   ├── ai/                      # anomaly detection, predictive maintenance, self-healing engine, chat assistant
│   ├── iot/simulator.py         # background sensor simulator -> Socket.IO broadcast
│   └── utils/notifications.py   # email/SMS stubs (wire real providers here)
├── frontend/
│   └── src/
│       ├── pages/                # Dashboard, Machines, Maintenance, Inventory, Alerts, Reports, ChatAssistant, DigitalTwin
│       ├── components/           # Sidebar, Topbar, MachineCard, HealthGauge, SensorChart
│       ├── three/FactoryScene.tsx  # hand-rolled Three.js digital twin (drag-rotate, zoom, click-to-select)
│       ├── context/AuthContext.tsx
│       └── api/client.ts, socket.ts
├── database/schema.sql          # raw SQL DDL for all 12 tables (for DBA review / non-SQLAlchemy tooling)
└── docker-compose.yml           # Postgres + backend containers
```

## Database tables

`users`, `machines`, `sensors`, `sensor_data`, `predictions`, `alerts`,
`technicians`, `maintenance`, `spare_parts`, `inventory`, `reports`, `logs`.

## AI modules

1. **Anomaly Detection** (`ai/anomaly_detection.py`) — Isolation Forest flags
   sensor readings that deviate from the learned normal operating envelope.
2. **Predictive Maintenance** (`ai/predictive_maintenance.py`) — RandomForest
   classifier + regressor produce `failure_probability` and estimated
   `remaining_useful_life_days`.
3. **Self-Healing Recommendation Engine** (`ai/self_healing_engine.py`) —
   rule-based (transparent/auditable, matters for factory safety): given a
   fault type, returns cause, corrective action, required technician
   specialty, and ETA.
4. **AI Chat Assistant** (`ai/chat_assistant.py`) — answers grounded in the
   live database ("Why did Machine 5 alarm?", "What's the failure risk for
   CNC Mill 01?").

All three predictive models train at process start on synthetic
physically-plausible data (`ai/data_gen.py`) so the platform is fully
functional immediately. Replace `generate_training_data()` with a query
against historical `sensor_data` + `maintenance` records once you have
enough production history to train on real labels.

## Running locally

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # edit DATABASE_URL if using Postgres; SQLite works with no changes
python seed.py            # creates tables + demo data
python app.py             # runs on http://localhost:5000
```

Demo logins (after `seed.py`):
- `admin@ishfp.local` / `admin123` (Admin)
- `engineer@ishfp.local` / `engineer123` (Engineer)
- `manager@ishfp.local` / `manager123` (Manager)

### Frontend
```bash
cd frontend
npm install
npm run dev                # runs on http://localhost:5173, proxies /api and /socket.io to :5000
```

### With Docker (Postgres + backend)
```bash
docker compose up --build
```
Then run the frontend separately with `npm run dev` (or add a frontend
service to `docker-compose.yml` for a full containerized stack).

## How the self-healing loop works end-to-end

1. `iot/simulator.py` runs on a background scheduler (default every 5s),
   perturbing each machine's sensor readings and occasionally injecting a
   fault (stand-in for a real MQTT ingestion pipeline).
2. Each reading is scored by **anomaly detection** and **predictive
   maintenance**; results are stored in `sensor_data` and `predictions`.
3. If a reading is anomalous or high-risk, the **self-healing engine**
   generates a structured recommendation and opens an `Alert`, auto-assigns
   an available technician by specialty, and the machine's status flips to
   `warning`/`critical`.
4. The alert is broadcast over Socket.IO — the dashboard shows a live toast
   and the machine card updates color immediately.
5. A technician reviews the alert (with cause + recommended fix already
   attached) in the **Alerts** page, and resolves it — the machine returns
   to `healthy` and its health score recovers.
6. **Reports** can be generated on demand (daily/weekly/monthly, PDF or
   Excel) summarizing machine status, alerts, and predictions for that
   window.

## Extending to real hardware

- Replace `iot/simulator.py`'s random-walk with an MQTT `on_message`
  callback (paho-mqtt) that writes into `SensorData` and calls the same
  `score_reading()` / `predict()` / `recommend()` pipeline.
- Point `DATABASE_URL` at a managed Postgres instance.
- Wire `utils/notifications.py`'s `send_email` / `send_sms` stubs to real
  SMTP / Twilio credentials.
- Swap the AI Chat Assistant's rule-based matcher for an LLM-backed RAG
  pipeline once you want free-form Q&A beyond the current intents.
- Swap the digital twin's box meshes for real GLTF machine models — the
  `machineId -> mesh` map in `FactoryScene.tsx` is built for exactly that.
