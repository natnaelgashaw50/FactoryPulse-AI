"""
Seed the database with demo users, machines, sensors, technicians and
spare parts so the platform is immediately explorable after setup.

Run:  python seed.py
"""
from werkzeug.security import generate_password_hash
from app import create_app
from backend.extensions import db
from backend.models import User, Machine, Sensor, Technician, SparePart, Inventory

MACHINES = [
    ("CNC Mill 01", "CNC", "Line A", (0, 0, 0)),
    ("Robotic Arm A3", "Robotic Arm", "Line A", (4, 0, 0)),
    ("Conveyor L2", "Conveyor", "Line A", (8, 0, 0)),
    ("Injection Molder 4", "Injection Molder", "Line B", (0, 0, 5)),
    ("Weld Station 7", "Welding", "Line B", (4, 0, 5)),
    ("Packaging Unit 5", "Packaging", "Line C", (8, 0, 5)),
]

SENSOR_SPECS = [
    ("temperature", "\u00b0C", 20, 90),
    ("vibration", "mm/s", 0, 4),
    ("pressure", "bar", 0, 15),
    ("humidity", "%", 20, 70),
    ("voltage", "V", 200, 240),
    ("current", "A", 2, 25),
]

TECHNICIANS = [
    ("Abebe Kebede", "Mechanical", "+251-911-000001"),
    ("Sara Tesfaye", "Electrical", "+251-911-000002"),
    ("Yonas Girma", "Hydraulics", "+251-911-000003"),
    ("Meron Alemu", "General", "+251-911-000004"),
]

SPARE_PARTS = [
    ("Bearing Set - Type A", "SKU-BRG-A", "CNC", 45.0, 12),
    ("Coolant Pump", "SKU-CLP-01", "CNC", 120.0, 4),
    ("Servo Motor 2kW", "SKU-SRV-2K", "Robotic Arm", 340.0, 3),
    ("Conveyor Belt 5m", "SKU-BLT-5M", "Conveyor", 90.0, 6),
    ("Hydraulic Seal Kit", "SKU-HYD-SL", "Injection Molder", 25.0, 20),
    ("Welding Tip Set", "SKU-WLD-TP", "Welding", 15.0, 30),
]


def run():
    app = create_app()
    with app.app_context():
        db.drop_all()
        db.create_all()

        users = [
            User(name="Admin User", email="admin@ishfp.local", role="Admin",
                 password_hash=generate_password_hash("admin123")),
            User(name="Engineer User", email="engineer@ishfp.local", role="Engineer",
                 password_hash=generate_password_hash("engineer123")),
            User(name="Manager User", email="manager@ishfp.local", role="Manager",
                 password_hash=generate_password_hash("manager123")),
        ]
        db.session.add_all(users)

        machine_objs = []
        for name, mtype, zone, pos in MACHINES:
            m = Machine(name=name, type=mtype, zone=zone, status="healthy", health_score=95,
                        position_x=pos[0], position_y=pos[1], position_z=pos[2])
            db.session.add(m)
            machine_objs.append(m)
        db.session.flush()

        for m in machine_objs:
            for stype, unit, lo, hi in SENSOR_SPECS:
                db.session.add(Sensor(machine_id=m.id, type=stype, unit=unit, min_safe=lo, max_safe=hi))

        for name, specialty, phone in TECHNICIANS:
            db.session.add(Technician(name=name, specialty=specialty, phone=phone, available=True))

        for name, sku, compat, cost, qty in SPARE_PARTS:
            part = SparePart(name=name, sku=sku, compatible_machine_type=compat, unit_cost=cost)
            db.session.add(part)
            db.session.flush()
            db.session.add(Inventory(spare_part_id=part.id, quantity=qty, reorder_threshold=5))

        db.session.commit()
        print("Seed complete.")
        print("Login with: admin@ishfp.local / admin123 (or engineer@/manager@ variants)")


if __name__ == "__main__":
    run()
