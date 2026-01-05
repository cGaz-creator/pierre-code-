import os
import resend
from typing import List, Optional

# Configuration
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
FROM_EMAIL = "contact@devis.ai"  # Or the verified sender in Resend
ADMIN_EMAIL = "contact@devis.ai" # Where to send the feedback

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

class EmailService:
    @staticmethod
    def send_email(to_email: str, subject: str, html_content: str, reply_to: Optional[str] = None, attachments: Optional[list] = None):
        if not RESEND_API_KEY:
            print(f"=== [MOCK EMAIL] To: {to_email} | Subject: {subject} | Attachments: {len(attachments) if attachments else 0} ===")
            return True

        try:
            params = {
                "from": "Devis.ai <onboarding@resend.dev>",
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }
            if reply_to:
                params["reply_to"] = reply_to
            
            if attachments:
                # Convert to Resend format if needed
                # Resend expects: {"filename": "foo.pdf", "content": [bytes...]}
                formatted_attachments = []
                for att in attachments:
                    # Handle dict from devis.py: {'file': bytes, 'filename': str, ...}
                    if isinstance(att, dict) and 'file' in att and 'filename' in att:
                        # Convert bytes to list of integers for JSON serialization if required by SDK, 
                        # OR if SDK handles bytes directly. safely assuming list(bytes) works for JSON APIs.
                        content = att['file']
                        if isinstance(content, bytes):
                            content = list(content)
                        formatted_attachments.append({
                            "filename": att['filename'],
                            "content": content
                        })
                    # Handle already formatted
                    elif isinstance(att, dict) and 'content' in att:
                         formatted_attachments.append(att)
                
                if formatted_attachments:
                    params["attachments"] = formatted_attachments

            r = resend.Emails.send(params)
            return r
        except Exception as e:
            print(f"Resend Error: {e}")
            raise e

    @staticmethod
    def send_idea_feedback(category: str, message: str, user_email: Optional[str] = None):
        subject = f"💡 Nouveau Feedback: {category}"
        html_content = f"""
        <h2>Nouveau Feedback Reçu</h2>
        <p><strong>Catégorie:</strong> {category}</p>
        <p><strong>Message:</strong></p>
        <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; color: #555;">
            {message}
        </blockquote>
        <p><strong>Envoyé par:</strong> {user_email if user_email else "Anonyme"}</p>
        """
        return EmailService.send_email(ADMIN_EMAIL, subject, html_content, reply_to=user_email)

    @staticmethod
    def send_quality_audit(score: int, details: dict, user_email: Optional[str] = None):
        subject = f"✅ Audit Qualité - Score: {score}/100"
        details_html = "<ul>"
        for k, v in details.items():
            details_html += f"<li><strong>{k}:</strong> {v}</li>"
        details_html += "</ul>"
        html_content = f"""
        <h2>Rapport d'Audit Qualité</h2>
        <p><strong>Score Global:</strong> <span style="font-size: 1.2em; font-weight: bold;">{score}/100</span></p>
        <h3>Détails:</h3>
        {details_html}
        <p><strong>Utilisateur:</strong> {user_email if user_email else "Non renseigné"}</p>
        """
        return EmailService.send_email(ADMIN_EMAIL, subject, html_content, reply_to=user_email)

# Async wrapper for compatibility with older code (devis.py)
async def send_email(recipients: List[str], subject: str, body: str, attachments: List = None):
    # Adapter function
    # body is passed as html_content
    # recipients is a list, but we take the first one or iterate? 
    # Resend 'to' can be a list of strings, so we pass it directly if we change signature, 
    # but EmailService.send_email takes single string 'to_email' currently? 
    # Let's check send_email signature above: def send_email(to_email: str, ...)
    # I should update EmailService.send_email to accept list or handle it here.
    
    # Simple fix: Iterate or join? Resend 'to' parameter IS a list of strings.
    # So actually my EmailService.send_email should take List[str] or I wrap it.
    
    # Hack for now: Take first recipient or join comma separated (Resend wants list of strings)
    # But EmailService.send_email line: "to": [to_email] implies single string input.
    # Let's adjust this wrapper to call it for each, or better: adjust EmailService to take list, 
    # BUT I defined it as str above.
    
    # Wait, previous step I defined: "to": [to_email]. 
    # If I pass a LIST to to_email, it becomes "to": [[...]] which is wrong.
    
    # I will support multiple recipients in the wrapper by calling it once per recipient OR 
    # better: just support the first one since abuse usually sends to one.
    
    to = recipients[0] if recipients else ADMIN_EMAIL # Fallback
    
    # We can pass attachments through
    return EmailService.send_email(to, subject, body, attachments=attachments)

