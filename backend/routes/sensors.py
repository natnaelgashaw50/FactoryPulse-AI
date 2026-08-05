from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models import Sensor, SensorData

bp = Blueprint("sensors", __name__, url_prefix="/api/sensors")


@bp.post("")
@jwt_required()
def create_sensor():
    data = request.get_json() or {}
    s = Sensor(
        machine_id=data["machine_id"], type=data["type"], unit=data["unit"],
        min_safe=data["min_safe"], max_safe=data["max_safe"],
    )
    db.session.add(s)
    db.session.commit()
    return jsonify(s.to_dict()), 201


@bp.post("/<int:sensor_id>/readings")
@jwt_required()
def add_reading(sensor_id):
    sensor = Sensor.query.get_or_404(sensor_id)
    data = request.get_json() or {}
    reading = SensorData(sensor_id=sensor.id, machine_id=sensor.machine_id, value=data["value"])
    db.session.add(reading)
    db.session.commit()
    return jsonify(reading.to_dict()), 201


@bp.get("/<int:sensor_id>/readings")
@jwt_required()
def list_readings(sensor_id):
    Sensor.query.get_or_404(sensor_id)
    limit = int(request.args.get("limit", 50))
    rows = (SensorData.query.filter_by(sensor_id=sensor_id)
            .order_by(SensorData.recorded_at.desc()).limit(limit).all())
    return jsonify([r.to_dict() for r in reversed(rows)])
