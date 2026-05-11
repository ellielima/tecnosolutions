from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.security import decode_token
from core.database import get_db
import jwt

bearer_scheme = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db=Depends(get_db)
):
    token = credentials.credentials
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")

    result = db.table("usuarios").select("*").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    user = result.data
    if not user["activo"]:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    return user


def require_admin(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    rol = db.table("roles").select("nombre").eq("id", current_user["rol_id"]).single().execute()
    if not rol.data or rol.data["nombre"] != "Administrador":
        raise HTTPException(status_code=403, detail="Se requiere rol Administrador")
    return current_user


def get_user_role(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    """Retorna (user, rol_nombre)."""
    rol = db.table("roles").select("nombre").eq("id", current_user["rol_id"]).single().execute()
    rol_nombre = rol.data["nombre"] if rol.data else "Empleado"
    return current_user, rol_nombre
