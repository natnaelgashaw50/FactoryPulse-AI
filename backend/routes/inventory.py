from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from backend.models import SparePart, Inventory

bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")


@bp.get("/parts")
@jwt_required()
def list_parts():
    return jsonify([p.to_dict() for p in SparePart.query.all()])


@bp.post("/parts")
@jwt_required()
def create_part():
    data = request.get_json() or {}
    p = SparePart(name=data["name"], sku=data["sku"],
                   compatible_machine_type=data.get("compatible_machine_type"),
                   unit_cost=data.get("unit_cost", 0))
    db.session.add(p)
    db.session.commit()
    inv = Inventory(spare_part_id=p.id, quantity=data.get("quantity", 0),
                     reorder_threshold=data.get("reorder_threshold", 5))
    db.session.add(inv)
    db.session.commit()
    return jsonify(p.to_dict()), 201


@bp.get("/stock")
@jwt_required()
def stock_levels():
    rows = Inventory.query.all()
    return jsonify([r.to_dict() for r in rows])


@bp.patch("/stock/<int:inv_id>")
@jwt_required()
def adjust_stock(inv_id):
    inv = Inventory.query.get_or_404(inv_id)
    data = request.get_json() or {}
    if "quantity" in data:
        inv.quantity = data["quantity"]
    db.session.commit()
    return jsonify(inv.to_dict())


@bp.get("/reorder-suggestions")
@jwt_required()
def reorder_suggestions():
    rows = Inventory.query.filter(Inventory.quantity <= Inventory.reorder_threshold).all()
    return jsonify([r.to_dict() for r in rows])
