from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models import Alert, Machine, Technician
from backend.ai.self_healing_engine import recommend
from backend.utils.notifications import notify
from backend.utils.email_service import send_email
bp = Blueprint("alerts", __name__, url_prefix="/api/alerts")


@bp.get("")
@jwt_required()
def list_alerts():
    status = request.args.get("status")
    q = Alert.query
    if status:
        q = q.filter_by(status=status)
    rows = q.order_by(Alert.created_at.desc()).limit(100).all()
    return jsonify([r.to_dict() for r in rows])


@bp.post("/raise")
@jwt_required()
def raise_alert():
    """Create an alert with an auto-generated self-healing recommendation and technician dispatch."""
    data = request.get_json() or {}
    machine = Machine.query.get_or_404(data["machine_id"])
    sensor_type = data.get("sensor_type", "temperature")
    severity_score = float(data.get("severity", 60))

    rec = recommend(sensor_type, severity_score, machine.name)

    technician = (Technician.query.filter_by(specialty=rec["specialty_required"], available=True).first()
                  or Technician.query.filter_by(available=True).first())

    alert = Alert(
        machine_id=machine.id,
        severity=rec["urgency"],
        title=rec["title"],
        message=rec["message"],
        cause=rec["cause"],
        recommendation=rec["recommendation"],
        assigned_technician_id=technician.id if technician else None,
        estimated_minutes=rec["estimated_minutes"],
    )
    machine.status = "critical" if rec["urgency"] == "critical" else "warning"
    db.session.add(alert)
    db.session.commit()
    db.session.add(alert)
    db.session.commit()

    notify(
        subject=f"[{rec['urgency'].upper()}] {machine.name}: {rec['title']}",
        body=rec["message"]
    )

    if rec["urgency"].lower() == "critical":

        send_email(
            subject=f"Critical Machine Alert - {machine.name}",
            message=f"""
Critical Machine Alert

Machine:
{machine.name}

Alert:
{rec['title']}

Message:
{rec['message']}

Cause:
{rec['cause']}

Recommendation:
{rec['recommendation']}
"""
        )

    return jsonify(alert.to_dict()), 201
   
