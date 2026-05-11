from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from typing import Optional
from core.database import get_db
from core.dependencies import get_current_user, require_admin
from core.security import hash_password
from services.audit_service import registrar_auditoria

router = APIRouter()

class UsuarioCreate(BaseModel):
    nombre: str
    correo: EmailStr
    password: str
    telefono: Optional[str] = None
    rol_id: int
    activo: bool = True

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    rol_id: Optional[int] = None
    activo: Optional[bool] = None

class ChangePasswordRequest(BaseModel):
    password_actual: str
    nueva_password: str


@router.get("/")
def listar_usuarios(current_user=Depends(require_admin), db=Depends(get_db)):
    result = db.table("usuarios").select("id, nombre, correo, telefono, activo, ultimo_login, creado_en, rol_id, roles(nombre)").execute()
    return result.data

@router.get("/me")
def me(current_user=Depends(get_current_user), db=Depends(get_db)):
    result = db.table("usuarios").select("id, nombre, correo, telefono, activo, ultimo_login, rol_id, roles(nombre)").eq("id", current_user["id"]).single().execute()
    return result.data

@router.post("/", status_code=201)
def crear_usuario(body: UsuarioCreate, request: Request, current_user=Depends(require_admin), db=Depends(get_db)):
    existing = db.table("usuarios").select("id").eq("correo", body.correo).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="El correo ya está registrado")
    data = body.dict(exclude={"password"})
    data["password_hash"] = hash_password(body.password)
    result = db.table("usuarios").insert(data).execute()
    usuario = result.data[0]
    registrar_auditoria(current_user["id"], "usuarios", "INSERT", usuario["id"], f"Usuario '{usuario['nombre']}' creado", request.client.host if request.client else None, db)
    del usuario["password_hash"]
    return usuario

@router.put("/{usuario_id}")
def actualizar_usuario(usuario_id: str, body: UsuarioUpdate, request: Request, current_user=Depends(require_admin), db=Depends(get_db)):
    data = {k: v for k, v in body.dict().items() if v is not None}
    result = db.table("usuarios").update(data).eq("id", usuario_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    registrar_auditoria(current_user["id"], "usuarios", "UPDATE", usuario_id, f"Usuario #{usuario_id} actualizado", request.client.host if request.client else None, db)
    return result.data[0]

@router.delete("/{usuario_id}", status_code=204)
def eliminar_usuario(usuario_id: str, request: Request, current_user=Depends(require_admin), db=Depends(get_db)):
    if usuario_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    db.table("usuarios").delete().eq("id", usuario_id).execute()
    registrar_auditoria(current_user["id"], "usuarios", "DELETE", usuario_id, f"Usuario #{usuario_id} eliminado", request.client.host if request.client else None, db)
    return None

@router.get("/roles/lista")
def roles(db=Depends(get_db)):
    return db.table("roles").select("*").execute().data
