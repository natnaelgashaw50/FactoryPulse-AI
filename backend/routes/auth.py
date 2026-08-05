from functools import wraps

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)

from backend.extensions import db
from backend.models import User

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# ==========================
# Register
# ==========================
@bp.post("/register")
def register():
    data = request.get_json() or {}

    for field in ("name", "email", "password"):
        if not data.get(field):
            return jsonify({
                "error": f"{field} is required"
            }), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({
            "error": "Email already registered"
        }), 409

    user = User(
        name=data["name"],
        email=data["email"],
        password_hash=generate_password_hash(data["password"]),
        role=data.get("role", "Technician")
    )

    db.session.add(user)
    db.session.commit()

    return jsonify(user.to_dict()), 201


# ==========================
# Login
# ==========================
@bp.post("/login")
def login():
    data = request.get_json() or {}

    user = User.query.filter_by(
        email=data.get("email")
    ).first()

    if user is None:
        return jsonify({
            "error": "Invalid credentials"
        }), 401

    if not check_password_hash(
        user.password_hash,
        data.get("password", "")
    ):
        return jsonify({
            "error": "Invalid credentials"
        }), 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role,
            "name": user.name,
        },
    )

    refresh_token = create_refresh_token(
        identity=str(user.id)
    )

    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict(),
    }), 200


# ==========================
# Current User
# ==========================
@bp.get("/me")
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    return jsonify(user.to_dict())


# ==========================
# Role Permission Decorator
# ==========================
def role_required(*roles):
    def wrapper(fn):

        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):

            claims = get_jwt()

            if claims.get("role") not in roles:
                return jsonify({
                    "error": "Forbidden",
                    "message": "You don't have permission."
                }), 403

            return fn(*args, **kwargs)

        return decorator

    return wrapper


# ==========================
# Admin Route
# ==========================
@bp.get("/admin")
@role_required("Admin")
def admin_only():
    return jsonify({
        "message": "Welcome Admin"
    })


# ==========================
# Engineer Route
# ==========================
@bp.get("/engineer")
@role_required("Engineer")
def engineer_only():
    return jsonify({
        "message": "Welcome Engineer"
    })


# ==========================
# Dashboard Route
# ==========================
@bp.get("/dashboard")
@role_required("Admin", "Engineer", "Manager")
def dashboard():
    return jsonify({
        "message": "Dashboard Access Granted"
    })
