from flask import Blueprint, jsonify, request
from backend.extensions import db
from backend.models import User
from werkzeug.security import generate_password_hash
from flask_jwt_extended import jwt_required
from backend.utils.permissions import role_required

bp = Blueprint(
    "users",
    __name__,
    url_prefix="/api/users"
)


@bp.get("/")
@jwt_required()
@role_required("Admin")
def get_users():

    users = User.query.all()

    return jsonify([
        u.to_dict()
        for u in users
    ])


@bp.post("/")
@jwt_required()
@role_required("Admin")
def create_user():

    data = request.json

    user = User(
        name=data["name"],
        email=data["email"],
        password_hash=generate_password_hash(
            data["password"]
        ),
        role=data.get("role", "Technician")
    )

    db.session.add(user)
    db.session.commit()

    return jsonify(
        user.to_dict()
    ), 201


@bp.delete("/<int:user_id>")
@jwt_required()
@role_required("Admin")
def delete_user(user_id):

    user = User.query.get_or_404(user_id)

    db.session.delete(user)
    db.session.commit()

    return jsonify({
        "message": "User deleted"
    })
@bp.put("/<int:user_id>")
@jwt_required()
@role_required("Admin")
def update_user(user_id):

    user = User.query.get_or_404(user_id)
    data = request.json

    user.name = data.get("name", user.name)
    user.email = data.get("email", user.email)
    user.role = data.get("role", user.role)

    if data.get("password"):
        user.password_hash = generate_password_hash(
            data["password"]
        )

    db.session.commit()

    return jsonify(user.to_dict())
