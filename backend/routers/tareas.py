from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from core.database import get_db
from core.dependencies import get_current_user, require_admin, get_user_role
from services.audit_service import registrar_auditoria

router = APIRouter()

class TareaCreate(BaseModel):
    proyecto_id: int
    responsable_id: Optional[str] = None
    titulo: str
    descripcion: Optional[str] = None
    prioridad_id: Optional[int] = None
    estado_id: Optional[int] = None
    fecha_inicio: Optional[str] = None
    fecha_limite: Optional[str] = None
    horas_estimadas: Optional[float] = None

class TareaUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    responsable_id: Optional[str] = None
    prioridad_id: Optional[int] = None
    estado_id: Optional[int] = None
    fecha_inicio: Optional[str] = None
    fecha_limite: Optional[str] = None
    fecha_finalizacion: Optional[str] = None
    porcentaje_avance: Optional[int] = None
    horas_reales: Optional[float] = None

class TareaProgressUpdate(BaseModel):
    porcentaje_avance: int
    estado_id: Optional[int] = None
    horas_reales: Optional[float] = None
    fecha_finalizacion: Optional[str] = None


@router.get("/")
def listar_tareas(user_and_role=Depends(get_user_role), db=Depends(get_db)):
    current_user, rol = user_and_role
    query = db.table("tareas").select(
        "*, proyectos(nombre), usuarios!tareas_responsable_id_fkey(nombre), "
        "estados_tarea(nombre), prioridades_tarea(nombre)"
    )
    # Empleados solo ven sus propias tareas
    if rol == "Empleado":
        query = query.eq("responsable_id", current_user["id"])

    result = query.order("fecha_limite").execute()

    # Marcar atrasadas automáticamente
    hoy = date.today().isoformat()
    tareas = []
    for t in result.data:
        if (t.get("fecha_limite") and t["fecha_limite"] < hoy
                and t.get("estados_tarea", {}).get("nombre") not in ["Completada", "Atrasada"]):
            t["_atrasada"] = True
        tareas.append(t)
    return tareas


@router.get("/mis-tareas")
def mis_tareas(current_user=Depends(get_current_user), db=Depends(get_db)):
    result = db.table("tareas").select(
        "*, proyectos(nombre), estados_tarea(nombre), prioridades_tarea(nombre)"
    ).eq("responsable_id", current_user["id"]).order("fecha_limite").execute()
    return result.data


@router.get("/{tarea_id}")
def obtener_tarea(tarea_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    result = db.table("tareas").select(
        "*, proyectos(nombre), usuarios!tareas_responsable_id_fkey(nombre, correo), "
        "estados_tarea(nombre), prioridades_tarea(nombre)"
    ).eq("id", tarea_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return result.data


@router.post("/", status_code=201)
def crear_tarea(body: TareaCreate, request: Request,
                current_user=Depends(require_admin), db=Depends(get_db)):
    data = body.dict()
    data["creada_por"] = current_user["id"]
    result = db.table("tareas").insert(data).execute()
    tarea = result.data[0]
    registrar_auditoria(current_user["id"], "tareas", "INSERT",
                        tarea["id"], f"Tarea '{tarea['titulo']}' creada",
                        request.client.host if request.client else None, db)
    return tarea


@router.put("/{tarea_id}")
def actualizar_tarea(tarea_id: int, body: TareaUpdate, request: Request,
                     current_user=Depends(require_admin), db=Depends(get_db)):
    data = {k: v for k, v in body.dict().items() if v is not None}
    data["actualizada_en"] = datetime.utcnow().isoformat()
    result = db.table("tareas").update(data).eq("id", tarea_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    registrar_auditoria(current_user["id"], "tareas", "UPDATE",
                        tarea_id, f"Tarea #{tarea_id} actualizada",
                        request.client.host if request.client else None, db)
    return result.data[0]


@router.patch("/{tarea_id}/progreso")
def actualizar_progreso(tarea_id: int, body: TareaProgressUpdate,
                         request: Request, user_and_role=Depends(get_user_role), db=Depends(get_db)):
    """Empleados pueden actualizar su propio progreso."""
    current_user, rol = user_and_role

    tarea_result = db.table("tareas").select("responsable_id").eq("id", tarea_id).single().execute()
    if not tarea_result.data:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    if rol == "Empleado" and tarea_result.data["responsable_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="No tienes permiso sobre esta tarea")

    data = {k: v for k, v in body.dict().items() if v is not None}
    data["actualizada_en"] = datetime.utcnow().isoformat()
    result = db.table("tareas").update(data).eq("id", tarea_id).execute()

    registrar_auditoria(current_user["id"], "tareas", "UPDATE",
                        tarea_id, f"Progreso actualizado a {body.porcentaje_avance}%",
                        request.client.host if request.client else None, db)
    return result.data[0]


@router.delete("/{tarea_id}", status_code=204)
def eliminar_tarea(tarea_id: int, request: Request,
                   current_user=Depends(require_admin), db=Depends(get_db)):
    db.table("tareas").delete().eq("id", tarea_id).execute()
    registrar_auditoria(current_user["id"], "tareas", "DELETE",
                        tarea_id, f"Tarea #{tarea_id} eliminada",
                        request.client.host if request.client else None, db)
    return None


@router.get("/estados/lista")
def estados_tarea(db=Depends(get_db)):
    return db.table("estados_tarea").select("*").execute().data

@router.get("/prioridades/lista")
def prioridades_tarea(db=Depends(get_db)):
    return db.table("prioridades_tarea").select("*").execute().data
