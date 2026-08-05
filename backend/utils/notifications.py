"""
Notification stubs for Email / SMS / Dashboard push.

Wire real providers here (e.g. smtplib + your SMTP host, or Twilio for
SMS). Left as clearly-labeled stubs so the rest of the system is fully
functional without requiring live credentials during development.
"""
import logging

logger = logging.getLogger("ishfp.notifications")


def send_email(to: str, subject: str, body: str):
    logger.info("[EMAIL STUB] to=%s subject=%s body=%s", to, subject, body)


def send_sms(to: str, body: str):
    logger.info("[SMS STUB] to=%s body=%s", to, body)


def notify(subject: str, body: str, to: str = "factory-ops@example.com"):
    """Fan out to all configured channels. Also emitted over Socket.IO by the caller for the dashboard toast."""
    send_email(to, subject, body)
