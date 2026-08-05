"""
Unsupervised anomaly detection over live sensor readings using
Isolation Forest. Flags a machine reading as anomalous when its
feature vector sits far from the learned "normal operation" manifold.
"""
from sklearn.ensemble import IsolationForest
from ai.data_gen import generate_training_data

_FEATURES = ["running_hours", "temperature", "vibration", "pressure", "voltage", "current"]
_model = None


def _get_model():
    global _model
    if _model is None:
        df = generate_training_data()
        _model = IsolationForest(n_estimators=150, contamination=0.06, random_state=42)
        _model.fit(df[_FEATURES])
    return _model


def score_reading(reading: dict) -> dict:
    """reading: dict with keys matching _FEATURES (missing keys default to safe values)."""
    model = _get_model()
    defaults = {"running_hours": 5000, "temperature": 55, "vibration": 1.2, "pressure": 6.0, "voltage": 220, "current": 12}
    vector = [[reading.get(f, defaults[f]) for f in _FEATURES]]
    raw_score = model.decision_function(vector)[0]   # higher = more normal
    is_anomaly = model.predict(vector)[0] == -1
    # Normalize raw_score (~[-0.5, 0.5]) into a 0-100 "anomaly severity"
    severity = max(0.0, min(100.0, (0.5 - raw_score) * 100))
    return {"is_anomaly": bool(is_anomaly), "severity": round(severity, 1)}
