from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from typing import Optional
from core.database import get_db
from core.dependencies import get_current_user, require_admin
from services.audit_service import registrar_auditoria

router = APIRouter()

class ClienteCreate(BaseModel):
    nombre: str
    correo: Optional[EmailStr] = None
    telefono: Optional[str] = None
    empresa: Optional[str] = None
    estado_id: Optional[int] = None

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    correo: Optional[EmailStr] = None
    telefono: Optional[str] = None
    empresa: Optional[str] = None
    estado_id: Optional[int] = None


@router.get("/")
def listar_clientes(current_user=Depends(get_current_user), db=Depends(get_db)):
    result = db.table("clientes")\
        .select("*, estados_cliente(nombre), usuarios!clientes_creado_por_fkey(nombre)")\
        .order("creado_en", desc=True).execute()
    return result.data


@router.get("/{cliente_id}")
def obtener_cliente(cliente_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    result = db.table("clientes")\
        .select("*, estados_cliente(nombre)")\
        .eq("id", cliente_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return result.data


@router.post("/", status_code=201)
def crear_cliente(body: ClienteCreate, request: Request,
                  current_user=Depends(require_admin), db=Depends(get_db)):
    data = body.dict()
    data["creado_por"] = current_user["id"]
    result = db.table("clientes").insert(data).execute()
    cliente = result.data[0]
    registrar_auditoria(current_user["id"], "clientes", "INSERT",
                        cliente["id"], f"Cliente '{cliente['nombre']}' creado",
                        request.client.host if request.client else None, db)
    return cliente


@router.put("/{cliente_id}")
def actualizar_cliente(cliente_id: int, body: ClienteUpdate, request: Request,
                        current_user=Depends(require_admin), db=Depends(get_db)):
    data = {k: v for k, v in body.dict().items() if v is not None}
    from datetime import datetime
    data["actualizado_en"] = datetime.utcnow().isoformat()
    result = db.table("clientes").update(data).eq("id", cliente_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    registrar_auditoria(current_user["id"], "clientes", "UPDATE",
                        cliente_id, f"Cliente #{cliente_id} actualizado",
                        request.client.host if request.client else None, db)
    return result.data[0]


@router.delete("/{cliente_id}", status_code=204)
def eliminar_cliente(cliente_id: int, request: Request,
                     current_user=Depends(require_admin), db=Depends(get_db)):
    db.table("clientes").delete().eq("id", cliente_id).execute()
    registrar_auditoria(current_user["id"], "clientes", "DELETE",
                        cliente_id, f"Cliente #{cliente_id} eliminado",
                        request.client.host if request.client else None, db)
    return None


@router.get("/estados/lista")
def estados_cliente(db=Depends(get_db)):
    return db.table("estados_cliente").select("*").execute().data
