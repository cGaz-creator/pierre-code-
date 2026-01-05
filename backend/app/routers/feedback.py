from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from ..services.email_service import EmailService

router = APIRouter(
    prefix="/feedback",
    tags=["feedback"]
)

class HomepageFeedback(BaseModel):
    category: str
    message: str
    user_email: Optional[str] = None

class QualityAudit(BaseModel):
    score: int
    details: dict
    user_email: Optional[str] = None

@router.post("/submit_idea")
def submit_idea(feedback: HomepageFeedback, background_tasks: BackgroundTasks):
    try:
        # Use the service directly
        # Note: In a real async app we might want to await this or put it in background task wrapper
        # The service method uses resend synchronously? Resend SDK is sync by default unless async client used.
        # But our EmailService wrapper is mixed. Let's assume sync for now or background it.
        
        # EmailService.send_idea_feedback is likely sync based on previous reads (using resend.Emails.send)
        # We can run it directly.
        EmailService.send_idea_feedback(
            category=feedback.category, 
            message=feedback.message, 
            user_email=feedback.user_email
        )
        return {"status": "ok", "message": "Feedback envoyé"}
    except Exception as e:
        print(f"Error sending feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit_quality_audit")
def submit_quality_audit(audit: QualityAudit):
    try:
        EmailService.send_quality_audit(
            score=audit.score,
            details=audit.details,
            user_email=audit.user_email
        )
        return {"status": "ok", "message": "Audit envoyé"}
    except Exception as e:
        print(f"Error sending audit: {e}")
        raise HTTPException(status_code=500, detail=str(e))

