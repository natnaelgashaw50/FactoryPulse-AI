from flask import Flask, jsonify
from backend.config import Config
from backend.extensions import db, jwt, cors, socketio
from backend.utils.email_service import send_email
from backend.routes import auth, machines, sensors, predictions, alerts, maintenance, inventory, chat, users, reports
from backend.iot.simulator import start_simulator
from dotenv import load_dotenv
load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    socketio.init_app(app)

    for module in (auth, machines, sensors, predictions, alerts, maintenance, inventory, chat, users, reports):
        app.register_blueprint(module.bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "Intelligent Self-Healing Factory Platform"})

    with app.app_context():
        db.create_all()

    start_simulator(app)
    return app


app = create_app()
@app.route("/api/test-email")
def test_email():
    send_email(
        "Test Alert",
        "ISHFP Email Alert System is working."
    )

    return jsonify({
        "message": "Email sent"
    })
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True, allow_unsafe_werkzeug=True)
