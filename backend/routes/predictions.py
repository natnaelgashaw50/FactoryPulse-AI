from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from backend.models import Machine, Prediction
from ai.predictive_maintenance import predict

bp = Blueprint("predictions", __name__, url_prefix="/api/predictions")


@bp.post("/<int:machine_id>/run")
@jwt_required()
def run_prediction(machine_id):
    machine = Machine.query.get_or_404(machine_id)
    data = request.get_json() or {}
    reading = {
        "running_hours": machine.running_hours,
        "temperature": data.get("temperature", 55),
        "vibration": data.get("vibration", 1.2),
        "pressure": data.get("pressure", 6.0),
        "voltage": data.get("voltage", 220),
        "current": data.get("current", 12),
    }
    result = predict(reading)
    p = Prediction(machine_id=machine.id, **result)
    db.session.add(p)
    db.session.commit()
    return jsonify(p.to_dict()), 201


@bp.get("/<int:machine_id>")
@jwt_required()
def latest_predictions(machine_id):
    Machine.query.get_or_404(machine_id)
    limit = int(request.args.get("limit", 20))
    rows = (Prediction.query.filter_by(machine_id=machine_id)
            .order_by(Prediction.created_at.desc()).limit(limit).all())
    return jsonify([r.to_dict() for r in reversed(rows)])


@bp.get("/at-risk")
@jwt_required()
def at_risk():
    """Latest prediction per machine, filtered to medium+ risk — powers the dashboard risk widget."""
    machines = Machine.query.all()
    result = []
    for m in machines:
        latest = (Prediction.query.filter_by(machine_id=m.id)
                  .order_by(Prediction.created_at.desc()).first())
        if latest and latest.risk_level in ("medium", "high", "critical"):
            entry = latest.to_dict()
            entry["machine_name"] = m.name
            result.append(entry)
    return jsonify(result)
