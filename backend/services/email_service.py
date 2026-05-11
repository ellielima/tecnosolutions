import httpx
import os
from core.config import settings

def send_reset_email(to_email: str, nombre: str, codigo: str, token: str):
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    html = f"""
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#1e293b;border-radius:16px;">
      <h1 style="color:#6366f1;">TecnoSolutions</h1>
      <p style="color:#cbd5e1;">Hola, <strong>{nombre}</strong></p>
      <p style="color:#94a3b8;">Tu código de verificación es:</p>
      <div style="background:#0f172a;padding:24px;text-align:center;border-radius:12px;margin:24px 0;">
        <span style="font-size:36px;font-weight:700;color:#6366f1;letter-spacing:8px;">{codigo}</span>
        <p style="color:#64748b;font-size:12px;">Válido por 15 minutos</p>
      </div>
      <a href="{reset_link}" style="display:block;background:#6366f1;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;">
        Restablecer contraseña
      </a>
    </div>
    """

    resend_api_key = os.getenv("RESEND_API_KEY", "")
    
    response = httpx.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {resend_api_key}",
            "Content-Type": "application/json"
        },
        json={
            "from": "TecnoSolutions <onboarding@resend.dev>",
            "to": [to_email],
            "subject": "🔐 Recupera tu contraseña — TecnoSolutions",
            "html": html
        }
    )
    
    if response.status_code != 200:
        raise Exception(f"Error enviando correo: {response.text}")