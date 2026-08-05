import os
import smtplib
from email.mime.text import MIMEText


def send_email(subject, body):

    sender = os.getenv("MAIL_USERNAME")
    password = os.getenv("MAIL_PASSWORD")
    receiver = os.getenv("ALERT_EMAIL")

    msg = MIMEText(body)

    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = receiver

    server = smtplib.SMTP(
        "smtp.gmail.com",
        587
    )

    server.starttls()

    server.login(
        sender,
        password
    )

    server.send_message(msg)

    server.quit()