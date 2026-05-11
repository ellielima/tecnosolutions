from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from core.database import get_db
from core.dependencies import get_current_user, require_admin
from services.audit_service import registrar_auditoria

router = APIRouter()

class ProyectoCreate(BaseModel):
    cliente_id: int
    nombre: str
    descripcion: Optional[str] = None
    fecha_inicio: str
    fecha_fin: Optional[str] = None
    presupuesto: Optional[float] = None
    estado_id: Optional[int] = None

class ProyectoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    presupuesto: Optional[float] = None
    estado_id: Optional[int] = None
    cliente_id: Optional[int] = None


@router.get("/")
def listar_proyectos(current_user=Depends(get_current_user), db=Depends(get_db)):
    result = db.table("proyectos")\
        .select("*, clientes(nombre, empresa), estados_proyecto(nombre)")\
        .order("creado_en", desc=True).execute()
    return result.data


@router.get("/stats/dashboard")
def stats_proyectos(current_user=Depends(require_admin), db=Depends(get_db)):
    proyectos = db.table("proyectos").select("*, estados_proyecto(nombre)").execute().data
    tareas = db.table("tareas").select("*, estados_tarea(nombre)").execute().data

    estado_counts = {}
    for p in proyectos:
        estado = p.get("estados_proyecto", {}).get("nombre", "Sin estado")
        estado_counts[estado] = estado_counts.get(estado, 0) + 1

    tarea_counts = {}
    for t in tareas:
        estado = t.get("estados_tarea", {}).get("nombre", "Sin estado")
        tarea_counts[estado] = tarea_counts.get(estado, 0) + 1

    return {
        "total_proyectos": len(proyectos),
        "total_tareas": len(tareas),
        "proyectos_por_estado": estado_counts,
        "tareas_por_estado": tarea_counts,
    }


@router.get("/{proyecto_id}")
def obtener_proyecto(proyecto_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    result = db.table("proyectos")\
        .select("*, clientes(nombre, empresa, correo), estados_proyecto(nombre)")\
        .eq("id", proyecto_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    return result.data


@router.get("/{proyecto_id}/tareas")
def tareas_del_proyecto(proyecto_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    result = db.table("tareas")\
        .select("*, usuarios!tareas_responsable_id_fkey(nombre), estados_tarea(nombre), prioridades_tarea(nombre)")\
        .eq("proyecto_id", proyecto_id)\
        .order("fecha_limite").execute()
    return result.data


@router.post("/", status_code=201)
def crear_proyecto(body: ProyectoCreate, request: Request,
                   current_user=Depends(require_admin), db=Depends(get_db)):
    data = body.dict()
    data["creado_por"] = current_user["id"]
    result = db.table("proyectos").insert(data).execute()
    proyecto = result.data[0]
    registrar_auditoria(current_user["id"], "proyectos", "INSERT",
                        proyecto["id"], f"Proyecto '{proyecto['nombre']}' creado",
                        request.client.host if request.client else None, db)
    return proyecto


@router.put("/{proyecto_id}")
def actualizar_proyecto(proyecto_id: int, body: ProyectoUpdate, request: Request,
                         current_user=Depends(require_admin), db=Depends(get_db)):
    data = {k: v for k, v in body.dict().items() if v is not None}
    data["actualizado_en"] = datetime.utcnow().isoformat()
    result = db.table("proyectos").update(data).eq("id", proyecto_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    registrar_auditoria(current_user["id"], "proyectos", "UPDATE",
                        proyecto_id, f"Proyecto #{proyecto_id} actualizado",
                        request.client.host if request.client else None, db)
    return result.data[0]


@router.delete("/{proyecto_id}", status_code=204)
def eliminar_proyecto(proyecto_id: int, request: Request,
                      current_user=Depends(require_admin), db=Depends(get_db)):
    db.table("proyectos").delete().eq("id", proyecto_id).execute()
    registrar_auditoria(current_user["id"], "proyectos", "DELETE",
                        proyecto_id, f"Proyecto #{proyecto_id} eliminado",
                        request.client.host if request.client else None, db)
    return None


@router.get("/estados/lista")
def estados_proyecto(db=Depends(get_db)):
    return db.table("estados_proyecto").select("*").execute().data
