from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

router = APIRouter(
    prefix="/feedback",
    tags=["feedback"]
)

class Feedback(BaseModel):
    message: str

def send_email_notification(message: str):
    sender_email = os.getenv("SMTP_USER")
    sender_password = os.getenv("SMTP_PASSWORD")
    receiver_email = "devis.ia.pro@gmail.com"
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))

    if not sender_email or not sender_password:
        print("SMTP Credentials not found. Skipping email.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = receiver_email
        msg['Subject'] = f"Nouveau Feedback Devis.ai - {datetime.now().strftime('%d/%m/%Y')}"

        body = f"Vous avez reçu un nouveau message :\n\n{message}\n\nDate: {datetime.now()}"
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, receiver_email, text)
        server.quit()
        print(f"Email sent to {receiver_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")

@router.post("")
def receive_feedback(feedback: Feedback, background_tasks: BackgroundTasks):
    # Always save to file as backup
    with open("feedbacks.txt", "a") as f:
        f.write(f"[{datetime.now()}] {feedback.message}\n")
    
    # Send email in background
    background_tasks.add_task(send_email_notification, feedback.message)
    
    return {"status": "received"}
