"""
Predictive maintenance: failure probability + Remaining Useful Life (RUL).

- RandomForestClassifier estimates failure_probability (0-1) for the
  near-term horizon.
- RUL is derived from the model's risk score mapped onto a
  0-365 day scale (higher risk -> fewer days remaining).

Trained once at process start on synthetic data (see data_gen.py) and
cached in memory. Swap generate_training_data() for a query against
sensor_data / maintenance history to retrain on real data.
"""
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from ai.data_gen import generate_training_data

_FEATURES = ["running_hours", "temperature", "vibration", "pressure", "voltage", "current"]
_clf = None
_reg = None


def _get_models():
    global _clf, _reg
    if _clf is None or _reg is None:
        df = generate_training_data()
        _clf = RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42)
        _clf.fit(df[_FEATURES], df["failed_soon"])

        _reg = RandomForestRegressor(n_estimators=200, max_depth=8, random_state=42)
        _reg.fit(df[_FEATURES], df["risk_score"])
    return _clf, _reg


def risk_level_for(probability: float) -> str:
    if probability >= 0.75:
        return "critical"
    if probability >= 0.5:
        return "high"
    if probability >= 0.25:
        return "medium"
    return "low"


def predict(reading: dict) -> dict:
    clf, reg = _get_models()
    defaults = {"running_hours": 5000, "temperature": 55, "vibration": 1.2, "pressure": 6.0, "voltage": 220, "current": 12}
    vector = [[reading.get(f, defaults[f]) for f in _FEATURES]]

    failure_probability = float(clf.predict_proba(vector)[0][1])
    risk_score = float(reg.predict(vector)[0])
    remaining_useful_life_days = max(1.0, 365 * (1 - risk_score))

    return {
        "failure_probability": failure_probability,
        "remaining_useful_life_days": remaining_useful_life_days,
        "risk_level": risk_level_for(failure_probability),
    }
