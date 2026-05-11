from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from core.database import get_db
from core.security import (
    verify_password, hash_password,
    create_access_token, create_refresh_token, decode_token,
    generate_reset_token, generate_reset_code
)
from core.config import settings
from services.email_service import send_reset_email
from services.audit_service import registrar_auditoria
import jwt

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    correo: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    correo: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str | None = None
    codigo: str | None = None
    nueva_password: str

class RefreshRequest(BaseModel):
    refresh_token: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/login")
def login(body: LoginRequest, request: Request, db=Depends(get_db)):
    result = db.table("usuarios").select("*, roles(nombre)").eq("correo", body.correo).single().execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    user = result.data
    if not user["activo"]:
        raise HTTPException(status_code=403, detail="Usuario inactivo")
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    # Actualizar último login
    db.table("usuarios").update({"ultimo_login": datetime.utcnow().isoformat()}).eq("id", user["id"]).execute()

    registrar_auditoria(
        usuario_id=user["id"],
        tabla_afectada="usuarios",
        accion="LOGIN",
        registro_id=user["id"],
        descripcion=f"Inicio de sesión de {user['nombre']}",
        ip_address=request.client.host if request.client else None,
        db=db
    )

    token_data = {"sub": user["id"], "rol": user["roles"]["nombre"]}
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "nombre": user["nombre"],
            "correo": user["correo"],
            "rol": user["roles"]["nombre"],
            "activo": user["activo"]
        }
    }


@router.post("/refresh")
def refresh_token(body: RefreshRequest):
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token inválido")
        new_token = create_access_token({"sub": payload["sub"], "rol": payload.get("rol")})
        return {"access_token": new_token, "token_type": "bearer"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db=Depends(get_db)):
    result = db.table("usuarios").select("id, nombre, correo").eq("correo", body.correo).execute()
    # Siempre retornar 200 para no revelar si el correo existe
    if not result.data:
        return {"message": "Si el correo existe, recibirás instrucciones."}

    user = result.data[0]
    token = generate_reset_token()
    codigo = generate_reset_code()
    expira = (datetime.utcnow() + timedelta(minutes=15)).isoformat()

    # Invalidar tokens anteriores
    db.table("password_resets").update({"usado": True})\
        .eq("usuario_id", user["id"]).eq("usado", False).execute()

    db.table("password_resets").insert({
        "usuario_id": user["id"],
        "token": token,
        "codigo": codigo,
        "expira_en": expira,
        "usado": False
    }).execute()

    try:
        send_reset_email(user["correo"], user["nombre"], codigo, token)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al enviar el correo")

    return {"message": "Si el correo existe, recibirás instrucciones."}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db=Depends(get_db)):
    if not body.token and not body.codigo:
        raise HTTPException(status_code=400, detail="Se requiere token o código")

    query = db.table("password_resets").select("*").eq("usado", False)
    if body.token:
        query = query.eq("token", body.token)
    else:
        query = query.eq("codigo", body.codigo)

    result = query.execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Código/token inválido o ya usado")

    reset = result.data[0]
    if datetime.fromisoformat(reset["expira_en"]) < datetime.utcnow():
        raise HTTPException(status_code=400, detail="El código ha expirado")

    new_hash = hash_password(body.nueva_password)
    db.table("usuarios").update({"password_hash": new_hash}).eq("id", reset["usuario_id"]).execute()
    db.table("password_resets").update({"usado": True}).eq("id", reset["id"]).execute()

    return {"message": "Contraseña actualizada correctamente"}
