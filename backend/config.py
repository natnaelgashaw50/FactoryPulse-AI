import os
from datetime import timedelta

JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    # Falls back to local SQLite so the project runs out of the box.
    # Set DATABASE_URL to a Postgres DSN in production, e.g.
    # postgresql://user:password@localhost:5432/ishfp
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'ishfp.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "change-this-secret-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)

    # Sensor simulator / prediction loop cadence, in seconds
    SIMULATOR_INTERVAL = int(os.environ.get("SIMULATOR_INTERVAL", 5))

    # Notification stubs — wire up real providers here
    SMTP_HOST = os.environ.get("SMTP_HOST", "")
    SMS_PROVIDER_KEY = os.environ.get("SMS_PROVIDER_KEY", "")

    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173")
