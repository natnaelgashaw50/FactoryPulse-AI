from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Maintenance, Technician

bp = Blueprint("maintenance", __name__, url_prefix="/api/maintenance")


@bp.get("")
@jwt_required()
def list_maintenance():
    rows = Maintenance.query.order_by(Maintenance.scheduled_at.asc()).all()
    return jsonify([r.to_dict() for r in rows])


@bp.post("")
@jwt_required()
def schedule_maintenance():
    data = request.get_json() or {}
    from datetime import datetime
    m = Maintenance(
        machine_id=data["machine_id"],
        technician_id=data.get("technician_id"),
        alert_id=data.get("alert_id"),
        scheduled_at=datetime.fromisoformat(data["scheduled_at"]),
        duration_minutes=data.get("duration_minutes", 60),
        task=data["task"],
    )
    db.session.add(m)
    db.session.commit()
    return jsonify(m.to_dict()), 201


@bp.patch("/<int:maint_id>")
@jwt_required()
def update_maintenance(maint_id):
    m = Maintenance.query.get_or_404(maint_id)
    data = request.get_json() or {}
    if "status" in data:
        m.status = data["status"]
    if "technician_id" in data:
        m.technician_id = data["technician_id"]
    db.session.commit()
    return jsonify(m.to_dict())


@bp.get("/technicians")
@jwt_required()
def list_technicians():
    return jsonify([t.to_dict() for t in Technician.query.all()])
