"""
AI Chat Assistant.

Answers natural-language operator questions by grounding responses in
the live database (alerts, predictions, machines) rather than a
general-purpose LLM — this keeps answers accurate and auditable for a
factory-floor setting. Pattern-matches intent, then queries.

Swap `_answer_*` internals for an LLM-backed RAG pipeline later
without changing the calling contract: ask(question) -> str.
"""
import re
from backend.models import Machine, Alert, Prediction


def _find_machine(question: str):
    m = re.search(r"machine\s*#?\s*(\d+)", question, re.IGNORECASE)
    if m:
        return Machine.query.get(int(m.group(1)))
    # try matching by name fragment
    for machine in Machine.query.all():
        if machine.name.lower() in question.lower():
            return machine
    return None


def ask(question: str) -> str:
    q = question.lower().strip()
    machine = _find_machine(question)

    if any(k in q for k in ["alarm", "alert", "why did", "why is"]) and machine:
        alert = (Alert.query.filter_by(machine_id=machine.id)
                 .order_by(Alert.created_at.desc()).first())
        if not alert:
            return f"{machine.name} has no recorded alerts. Current status: {machine.status}."
        status = "still open" if alert.status == "open" else f"marked {alert.status}"
        return (
            f"{machine.name} raised '{alert.title}' ({alert.severity}) — {status}. "
            f"Likely cause: {alert.cause or 'under investigation'}. "
            f"Recommended action: {alert.recommendation or 'inspection pending'}."
        )

    if any(k in q for k in ["risk", "fail", "predict", "rul", "useful life"]) and machine:
        pred = (Prediction.query.filter_by(machine_id=machine.id)
                .order_by(Prediction.created_at.desc()).first())
        if not pred:
            return f"No prediction has been generated for {machine.name} yet."
        return (
            f"{machine.name} has a {pred.failure_probability * 100:.0f}% failure probability "
            f"({pred.risk_level} risk) with an estimated {pred.remaining_useful_life_days:.0f} "
            f"days of remaining useful life."
        )

    if any(k in q for k in ["status", "health", "how is"]) and machine:
        return f"{machine.name} is currently {machine.status} with a health score of {machine.health_score:.0f}/100."

    if "how many" in q and "critical" in q:
        count = Machine.query.filter_by(status="critical").count()
        return f"There are currently {count} machine(s) in critical status."

    if machine is None and any(k in q for k in ["alarm", "alert", "risk", "status", "health"]):
        return "I couldn't identify which machine you mean — try including its name or ID, e.g. 'Machine 5'."

    return (
        "I can answer questions like 'Why did Machine 5 alarm?', "
        "'What's the failure risk for CNC Mill 01?', or 'How many machines are critical?'."
    )
