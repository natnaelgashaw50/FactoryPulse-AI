"""
Synthetic training-data generator.

In production this would be replaced by historical sensor_data +
maintenance records pulled from the database. For a working demo /
first deployment we generate physically-plausible synthetic data so
the models train and produce sensible output immediately.
"""
import numpy as np
import pandas as pd


def generate_training_data(n=4000, seed=42):
    rng = np.random.default_rng(seed)

    running_hours = rng.uniform(0, 20000, n)
    temperature = rng.normal(55, 12, n) + running_hours * 0.0015
    vibration = rng.normal(1.2, 0.4, n) + running_hours * 0.00008
    pressure = rng.normal(6.0, 1.5, n)
    voltage = rng.normal(220, 8, n)
    current = rng.normal(12, 3, n)

    # Failure risk rises with running hours, temperature and vibration.
    risk_score = (
        0.35 * (running_hours / 20000)
        + 0.30 * np.clip((temperature - 40) / 60, 0, 1)
        + 0.25 * np.clip((vibration - 0.5) / 3, 0, 1)
        + 0.10 * rng.uniform(0, 1, n)
    )
    failed_soon = (risk_score + rng.normal(0, 0.05, n)) > 0.55

    df = pd.DataFrame({
        "running_hours": running_hours,
        "temperature": temperature,
        "vibration": vibration,
        "pressure": pressure,
        "voltage": voltage,
        "current": current,
        "failed_soon": failed_soon.astype(int),
        "risk_score": risk_score,
    })
    return df
