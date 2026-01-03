import os
from typing import List
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from starlette.responses import JSONResponse

# Configuration (Env vars or defaults)
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "contact@devis.ai")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))

# Enable mock if no password provided
USE_MOCK = len(SMTP_PASSWORD) == 0

conf = ConnectionConfig(
    MAIL_USERNAME=SMTP_USER,
    MAIL_PASSWORD=SMTP_PASSWORD,
    MAIL_FROM=SMTP_FROM,
    MAIL_PORT=SMTP_PORT,
    MAIL_SERVER=SMTP_SERVER,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    SUPPRESS_SEND=USE_MOCK, # True = Simulate sending
)

async def send_email(recipients: List[EmailStr], subject: str, body: str, attachments: List = None):
    """
    Send an email with optional attachments.
    If USE_MOCK is True, it just logs the email.
    """
    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        body=body,
        subtype=MessageType.html,
        attachments=attachments
    )

    fm = FastMail(conf)
    
    try:
        await fm.send_message(message)
        if USE_MOCK:
            print(f"=== [MOCK EMAIL] To: {recipients} | Subject: {subject} ===")
        return True
    except Exception as e:
        print(f"Email Error: {e}")
        raise e
