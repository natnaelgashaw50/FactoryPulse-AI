-- Intelligent Self-Healing Factory Platform (ISHFP)
-- PostgreSQL schema. Flask-SQLAlchemy also auto-creates these tables
-- via db.create_all() from backend/models.py — this file is provided
-- for direct psql review / migration tooling / DBA handoff.

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'Technician' CHECK (role IN ('Admin','Engineer','Technician','Manager')),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE machines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    type VARCHAR(80) NOT NULL,
    zone VARCHAR(80) NOT NULL DEFAULT 'Line A',
    status VARCHAR(20) NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy','warning','critical','healing','offline')),
    health_score DOUBLE PRECISION DEFAULT 100.0,
    installed_at TIMESTAMP NOT NULL DEFAULT now(),
    running_hours DOUBLE PRECISION DEFAULT 0.0,
    position_x DOUBLE PRECISION DEFAULT 0.0,
    position_y DOUBLE PRECISION DEFAULT 0.0,
    position_z DOUBLE PRECISION DEFAULT 0.0
);

CREATE TABLE sensors (
    id SERIAL PRIMARY KEY,
    machine_id INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    min_safe DOUBLE PRECISION NOT NULL,
    max_safe DOUBLE PRECISION NOT NULL
);

CREATE TABLE sensor_data (
    id BIGSERIAL PRIMARY KEY,
    sensor_id INTEGER NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    machine_id INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    value DOUBLE PRECISION NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_sensor_data_recorded_at ON sensor_data(recorded_at);
CREATE INDEX idx_sensor_data_machine ON sensor_data(machine_id);

CREATE TABLE technicians (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    specialty VARCHAR(80),
    available BOOLEAN DEFAULT TRUE,
    phone VARCHAR(30)
);

CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    machine_id INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    failure_probability DOUBLE PRECISION NOT NULL,
    remaining_useful_life_days DOUBLE PRECISION NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low','medium','high','critical')),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    machine_id INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info','warning','critical','high','medium')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    cause VARCHAR(255),
    recommendation TEXT,
    assigned_technician_id INTEGER REFERENCES technicians(id),
    estimated_minutes INTEGER,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP
);

CREATE TABLE maintenance (
    id SERIAL PRIMARY KEY,
    machine_id INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    technician_id INTEGER REFERENCES technicians(id),
    alert_id INTEGER REFERENCES alerts(id),
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    task VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','cancelled'))
);

CREATE TABLE spare_parts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    sku VARCHAR(60) UNIQUE NOT NULL,
    compatible_machine_type VARCHAR(80),
    unit_cost DOUBLE PRECISION DEFAULT 0.0
);

CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    spare_part_id INTEGER NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0,
    reorder_threshold INTEGER DEFAULT 5,
    reorder_suggested BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    period VARCHAR(20) NOT NULL CHECK (period IN ('daily','weekly','monthly')),
    format VARCHAR(10) NOT NULL CHECK (format IN ('pdf','xlsx')),
    file_path VARCHAR(255) NOT NULL,
    generated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE logs (
    id BIGSERIAL PRIMARY KEY,
    actor VARCHAR(120),
    action VARCHAR(255) NOT NULL,
    machine_id INTEGER REFERENCES machines(id),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
