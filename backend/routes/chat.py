from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ai.chat_assistant import ask

bp = Blueprint("chat", __name__, url_prefix="/api/chat")


@bp.post("")
@jwt_required()
def chat():
    data = request.get_json() or {}
    question = data.get("question", "")
    if not question.strip():
        return jsonify({"error": "'question' is required"}), 400
    answer = ask(question)
    return jsonify({"question": question, "answer": answer})
