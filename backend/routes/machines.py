from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models import Machine, Sensor, SensorData

bp = Blueprint("machines", __name__, url_prefix="/api/machines")


@bp.get("")
@jwt_required()
def list_machines():
    machines = Machine.query.all()
    return jsonify([m.to_dict() for m in machines])


@bp.get("/overview")
@jwt_required()
def overview():
    machines = Machine.query.all()
    total = len(machines) or 1
    healthy = sum(1 for m in machines if m.status == "healthy")
    avg_health = sum(m.health_score for m in machines) / total
    by_status = {}
    for m in machines:
        by_status[m.status] = by_status.get(m.status, 0) + 1
    return jsonify({
        "total_machines": len(machines),
        "healthy_count": healthy,
        "ai_health_score": round(avg_health, 1),
        "by_status": by_status,
    })


@bp.post("")
@jwt_required()
def create_machine():
    data = request.get_json() or {}
    m = Machine(
        name=data["name"], type=data["type"], zone=data.get("zone", "Line A"),
        position_x=data.get("position", {}).get("x", 0),
        position_y=data.get("position", {}).get("y", 0),
        position_z=data.get("position", {}).get("z", 0),
    )
    db.session.add(m)
    db.session.commit()
    return jsonify(m.to_dict()), 201


@bp.get("/<int:machine_id>")
@jwt_required()
def get_machine(machine_id):
    m = Machine.query.get_or_404(machine_id)
    return jsonify(m.to_dict())


@bp.get("/<int:machine_id>/sensors")
@jwt_required()
def machine_sensors(machine_id):
    Machine.query.get_or_404(machine_id)
    sensors = Sensor.query.filter_by(machine_id=machine_id).all()
    return jsonify([s.to_dict() for s in sensors])


@bp.get("/<int:machine_id>/history")
@jwt_required()
def machine_history(machine_id):
    Machine.query.get_or_404(machine_id)
    limit = int(request.args.get("limit", 50))
    rows = (SensorData.query.filter_by(machine_id=machine_id)
            .order_by(SensorData.recorded_at.desc()).limit(limit).all())
    return jsonify([r.to_dict() for r in reversed(rows)])
