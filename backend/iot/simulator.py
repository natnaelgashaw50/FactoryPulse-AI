"""
IoT sensor simulator.

Stands in for a real MQTT ingestion pipeline (e.g. paho-mqtt
subscriber writing into sensor_data). Runs on an APScheduler
interval, perturbs each machine's readings, occasionally injects a
fault, runs it through anomaly detection + predictive maintenance,
and broadcasts the tick over Socket.IO so the dashboard updates live.

To swap in real hardware: replace `_tick()`'s random-walk with an
MQTT on_message callback that writes the incoming payload into
SensorData, then call `_evaluate(machine, reading)` the same way.
"""
import random
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler

from backend.extensions import db, socketio
from backend.models import Machine, Sensor, SensorData, Alert, Technician, Prediction
from backend.ai.anomaly_detection import score_reading
from backend.ai.predictive_maintenance import predict
from backend.ai.self_healing_engine import recommend
from backend.utils.notifications import notify

_scheduler = None


def _drift(value, low, high, step):
    value += random.uniform(-step, step)
    return max(low, min(high, value))


def _tick(app):
    with app.app_context():
        machines = Machine.query.all()
        for machine in machines:
            if machine.status in ("critical",):
                continue  # frozen while an incident is open, mirrors real "do not disturb during repair"

            sensors = Sensor.query.filter_by(machine_id=machine.id).all()
            reading = {"running_hours": machine.running_hours}
            fault_sensor = None

            for sensor in sensors:
                last = (SensorData.query.filter_by(sensor_id=sensor.id)
                        .order_by(SensorData.recorded_at.desc()).first())
                current = last.value if last else (sensor.min_safe + sensor.max_safe) / 2
                span = (sensor.max_safe - sensor.min_safe) or 1
                new_val = _drift(current, sensor.min_safe - span * 0.1, sensor.max_safe + span * 0.4, span * 0.05)

                # small chance to inject an out-of-range spike
                if random.random() < 0.015:
                    new_val = sensor.max_safe + span * random.uniform(0.3, 0.8)
                    fault_sensor = sensor

                db.session.add(SensorData(sensor_id=sensor.id, machine_id=machine.id, value=new_val))
                reading[sensor.type] = new_val

            machine.running_hours += 5 / 3600  # tick duration in hours

            anomaly = score_reading(reading)
            pred = predict(reading)
            db.session.add(Prediction(machine_id=machine.id, **pred))

            machine.health_score = max(0.0, min(100.0, 100 - pred["failure_probability"] * 100))

            if fault_sensor and (anomaly["is_anomaly"] or pred["risk_level"] in ("high", "critical")):
                rec = recommend(fault_sensor.type, anomaly["severity"], machine.name)
                technician = (Technician.query.filter_by(specialty=rec["specialty_required"], available=True).first()
                              or Technician.query.filter_by(available=True).first())
                alert = Alert(
                    machine_id=machine.id, severity=rec["urgency"], title=rec["title"],
                    message=rec["message"], cause=rec["cause"], recommendation=rec["recommendation"],
                    assigned_technician_id=technician.id if technician else None,
                    estimated_minutes=rec["estimated_minutes"],
                )
                machine.status = "critical" if rec["urgency"] == "critical" else "warning"
                db.session.add(alert)
                notify(subject=f"[{rec['urgency'].upper()}] {machine.name}: {rec['title']}", body=rec["message"])
                socketio.emit("alert", alert.to_dict())
            elif machine.status not in ("healthy",):
                pass  # stays in its current state until a technician resolves it via the API
            else:
                machine.status = "healthy"

            db.session.commit()
            socketio.emit("machine_update", machine.to_dict())

        socketio.emit("tick", {"at": datetime.utcnow().isoformat()})


def start_simulator(app):
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = BackgroundScheduler()
    interval = app.config.get("SIMULATOR_INTERVAL", 5)
    _scheduler.add_job(lambda: _tick(app), "interval", seconds=interval, id="ishfp_sensor_tick")
    _scheduler.start()
