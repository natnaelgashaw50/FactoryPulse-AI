"""
Self-Healing Recommendation Engine.

Given a triggering sensor/anomaly context, produces a structured
recommendation: what the problem is, the likely cause, what should
change, which technician specialty to dispatch, and an ETA. This is
rule-based (transparent + auditable, which matters for factory floor
safety) — the anomaly/prediction models decide *whether* to alert,
this decides *what to do about it*.
"""

_RULES = {
    "temperature": {
        "title": "Thermal Overload",
        "cause": "Coolant loop efficiency degraded or ambient heat load increased",
        "change": "Throttle output 20-30%, verify coolant flow, inspect heat exchanger",
        "specialty": "Mechanical",
        "eta_minutes": 45,
    },
    "vibration": {
        "title": "Vibration Anomaly",
        "cause": "Bearing wear or shaft misalignment",
        "change": "Recalibrate axis alignment, reduce feed rate, schedule bearing inspection",
        "specialty": "Mechanical",
        "eta_minutes": 60,
    },
    "pressure": {
        "title": "Pressure Deviation",
        "cause": "Hydraulic seal drift or valve blockage",
        "change": "Adjust relief valve, cycle pump, inspect seals for leakage",
        "specialty": "Hydraulics",
        "eta_minutes": 40,
    },
    "voltage": {
        "title": "Voltage Instability",
        "cause": "Power supply fluctuation or loose electrical connection",
        "change": "Inspect wiring terminals, verify power supply regulation",
        "specialty": "Electrical",
        "eta_minutes": 30,
    },
    "current": {
        "title": "Current Draw Spike",
        "cause": "Motor overload or partial mechanical jam",
        "change": "Inspect motor load, clear obstruction, verify overload relay setting",
        "specialty": "Electrical",
        "eta_minutes": 35,
    },
    "humidity": {
        "title": "Humidity Out of Range",
        "cause": "Enclosure seal failure or HVAC drift in the zone",
        "change": "Check enclosure gaskets, verify zone HVAC setpoint",
        "specialty": "Facilities",
        "eta_minutes": 25,
    },
}

_DEFAULT = {
    "title": "Undetermined Anomaly",
    "cause": "Sensor pattern deviates from learned normal operating envelope",
    "change": "Dispatch technician for manual inspection and diagnostics",
    "specialty": "General",
    "eta_minutes": 50,
}


def recommend(sensor_type: str, severity: float, machine_name: str) -> dict:
    rule = _RULES.get(sensor_type, _DEFAULT)
    urgency = "critical" if severity >= 75 else "high" if severity >= 50 else "medium"
    return {
        "title": rule["title"],
        "cause": rule["cause"],
        "recommendation": rule["change"],
        "specialty_required": rule["specialty"],
        "estimated_minutes": rule["eta_minutes"],
        "urgency": urgency,
        "message": (
            f"{machine_name}: {rule['title']} detected (severity {severity}/100). "
            f"Likely cause — {rule['cause']}. Recommended action — {rule['change']}."
        ),
    }
