from datetime import datetime
from extensions import db


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="Technician")  # Admin, Engineer, Technician, Manager
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email, "role": self.role}


class Machine(db.Model):
    __tablename__ = "machines"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    type = db.Column(db.String(80), nullable=False)
    zone = db.Column(db.String(80), nullable=False, default="Line A")
    status = db.Column(db.String(20), nullable=False, default="healthy")  # healthy, warning, critical, healing, offline
    health_score = db.Column(db.Float, default=100.0)
    installed_at = db.Column(db.DateTime, default=datetime.utcnow)
    running_hours = db.Column(db.Float, default=0.0)
    position_x = db.Column(db.Float, default=0.0)
    position_y = db.Column(db.Float, default=0.0)
    position_z = db.Column(db.Float, default=0.0)

    sensors = db.relationship("Sensor", backref="machine", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "type": self.type, "zone": self.zone,
            "status": self.status, "health_score": round(self.health_score, 1),
            "running_hours": round(self.running_hours, 1),
            "position": {"x": self.position_x, "y": self.position_y, "z": self.position_z},
        }


class Sensor(db.Model):
    __tablename__ = "sensors"
    id = db.Column(db.Integer, primary_key=True)
    machine_id = db.Column(db.Integer, db.ForeignKey("machines.id"), nullable=False)
    type = db.Column(db.String(40), nullable=False)  # temperature, vibration, pressure, humidity, voltage, current
    unit = db.Column(db.String(20), nullable=False)
    min_safe = db.Column(db.Float, nullable=False)
    max_safe = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {"id": self.id, "machine_id": self.machine_id, "type": self.type,
                "unit": self.unit, "min_safe": self.min_safe, "max_safe": self.max_safe}


class SensorData(db.Model):
    __tablename__ = "sensor_data"
    id = db.Column(db.Integer, primary_key=True)
    sensor_id = db.Column(db.Integer, db.ForeignKey("sensors.id"), nullable=False)
    machine_id = db.Column(db.Integer, db.ForeignKey("machines.id"), nullable=False)
    value = db.Column(db.Float, nullable=False)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {"id": self.id, "sensor_id": self.sensor_id, "machine_id": self.machine_id,
                "value": self.value, "recorded_at": self.recorded_at.isoformat()}


class Prediction(db.Model):
    __tablename__ = "predictions"
    id = db.Column(db.Integer, primary_key=True)
    machine_id = db.Column(db.Integer, db.ForeignKey("machines.id"), nullable=False)
    failure_probability = db.Column(db.Float, nullable=False)
    remaining_useful_life_days = db.Column(db.Float, nullable=False)
    risk_level = db.Column(db.String(20), nullable=False)  # low, medium, high, critical
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "machine_id": self.machine_id,
            "failure_probability": round(self.failure_probability, 3),
            "remaining_useful_life_days": round(self.remaining_useful_life_days, 1),
            "risk_level": self.risk_level, "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Alert(db.Model):
    __tablename__ = "alerts"
    id = db.Column(db.Integer, primary_key=True)
    machine_id = db.Column(db.Integer, db.ForeignKey("machines.id"), nullable=False)
    severity = db.Column(db.String(20), nullable=False)  # info, warning, critical
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    cause = db.Column(db.String(255))
    recommendation = db.Column(db.Text)
    assigned_technician_id = db.Column(db.Integer, db.ForeignKey("technicians.id"), nullable=True)
    estimated_minutes = db.Column(db.Integer)
    status = db.Column(db.String(20), default="open")  # open, acknowledged, resolved
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "machine_id": self.machine_id, "severity": self.severity,
            "title": self.title, "message": self.message, "cause": self.cause,
            "recommendation": self.recommendation, "assigned_technician_id": self.assigned_technician_id,
            "estimated_minutes": self.estimated_minutes, "status": self.status,
            "created_at": self.created_at.isoformat(),
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
        }


class Technician(db.Model):
    __tablename__ = "technicians"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    specialty = db.Column(db.String(80))
    available = db.Column(db.Boolean, default=True)
    phone = db.Column(db.String(30))

    def to_dict(self):
        return {"id": self.id, "name": self.name, "specialty": self.specialty,
                "available": self.available, "phone": self.phone}


class Maintenance(db.Model):
    __tablename__ = "maintenance"
    id = db.Column(db.Integer, primary_key=True)
    machine_id = db.Column(db.Integer, db.ForeignKey("machines.id"), nullable=False)
    technician_id = db.Column(db.Integer, db.ForeignKey("technicians.id"), nullable=True)
    alert_id = db.Column(db.Integer, db.ForeignKey("alerts.id"), nullable=True)
    scheduled_at = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer, default=60)
    task = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default="scheduled")  # scheduled, in_progress, completed, cancelled

    def to_dict(self):
        return {
            "id": self.id, "machine_id": self.machine_id, "technician_id": self.technician_id,
            "alert_id": self.alert_id, "scheduled_at": self.scheduled_at.isoformat(),
            "duration_minutes": self.duration_minutes, "task": self.task, "status": self.status,
        }


class SparePart(db.Model):
    __tablename__ = "spare_parts"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    sku = db.Column(db.String(60), unique=True, nullable=False)
    compatible_machine_type = db.Column(db.String(80))
    unit_cost = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "sku": self.sku,
                "compatible_machine_type": self.compatible_machine_type, "unit_cost": self.unit_cost}


class Inventory(db.Model):
    __tablename__ = "inventory"
    id = db.Column(db.Integer, primary_key=True)
    spare_part_id = db.Column(db.Integer, db.ForeignKey("spare_parts.id"), nullable=False)
    quantity = db.Column(db.Integer, default=0)
    reorder_threshold = db.Column(db.Integer, default=5)
    reorder_suggested = db.Column(db.Boolean, default=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    part = db.relationship("SparePart")

    def to_dict(self):
        return {
            "id": self.id, "spare_part_id": self.spare_part_id, "part_name": self.part.name if self.part else None,
            "quantity": self.quantity, "reorder_threshold": self.reorder_threshold,
            "reorder_suggested": self.quantity <= self.reorder_threshold,
        }


class Report(db.Model):
    __tablename__ = "reports"
    id = db.Column(db.Integer, primary_key=True)
    period = db.Column(db.String(20), nullable=False)  # daily, weekly, monthly
    format = db.Column(db.String(10), nullable=False)  # pdf, xlsx
    file_path = db.Column(db.String(255), nullable=False)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {"id": self.id, "period": self.period, "format": self.format,
                "file_path": self.file_path, "generated_at": self.generated_at.isoformat()}


class Log(db.Model):
    __tablename__ = "logs"
    id = db.Column(db.Integer, primary_key=True)
    actor = db.Column(db.String(120))
    action = db.Column(db.String(255), nullable=False)
    machine_id = db.Column(db.Integer, db.ForeignKey("machines.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {"id": self.id, "actor": self.actor, "action": self.action,
                "machine_id": self.machine_id, "created_at": self.created_at.isoformat()}
