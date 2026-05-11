import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from core.config import settings


def send_reset_email(to_email: str, nombre: str, codigo: str, token: str):
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: 'Segoe UI', sans-serif; background:#0f172a; padding:40px;">
      <div style="max-width:520px; margin:0 auto; background:#1e293b; border-radius:16px; overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:32px; text-align:center;">
          <h1 style="color:#fff; margin:0; font-size:24px;">TecnoSolutions</h1>
          <p style="color:#e0e7ff; margin:8px 0 0;">Recuperación de contraseña</p>
        </div>
        <div style="padding:32px;">
          <p style="color:#cbd5e1; font-size:16px;">Hola, <strong style="color:#f1f5f9;">{nombre}</strong></p>
          <p style="color:#94a3b8;">Recibimos una solicitud para restablecer tu contraseña.</p>

          <div style="background:#0f172a; border-radius:12px; padding:24px; text-align:center; margin:24px 0;">
            <p style="color:#64748b; font-size:13px; margin:0 0 8px;">Tu código de verificación:</p>
            <span style="font-size:36px; font-weight:700; color:#6366f1; letter-spacing:8px;">{codigo}</span>
            <p style="color:#64748b; font-size:12px; margin:8px 0 0;">Válido por 15 minutos</p>
          </div>

          <p style="color:#94a3b8; font-size:14px;">O haz clic en el enlace:</p>
          <a href="{reset_link}"
             style="display:block; background:linear-gradient(135deg,#6366f1,#8b5cf6);
                    color:#fff; text-align:center; padding:14px; border-radius:8px;
                    text-decoration:none; font-weight:600; margin:16px 0;">
            Restablecer contraseña
          </a>

          <p style="color:#475569; font-size:12px; margin-top:24px;">
            Si no solicitaste este cambio, ignora este correo. Tu contraseña permanece segura.
          </p>
        </div>
      </div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "🔐 Recupera tu contraseña — TecnoSolutions"
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        raise
