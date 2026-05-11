from fastapi import APIRouter, Depends
from core.database import get_db
from core.dependencies import require_admin

router = APIRouter()

@router.get("/")
def listar_auditoria(
    limit: int = 100,
    offset: int = 0,
    current_user=Depends(require_admin),
    db=Depends(get_db)
):
    result = db.table("auditoria")\
        .select("*, usuarios(nombre, correo)")\
        .order("fecha", desc=True)\
        .range(offset, offset + limit - 1)\
        .execute()
    return result.data

@router.get("/stats")
def stats_auditoria(current_user=Depends(require_admin), db=Depends(get_db)):
    result = db.table("auditoria").select("accion, tabla_afectada, fecha").execute()
    registros = result.data
    acciones = {}
    tablas = {}
    for r in registros:
        a = r.get("accion", "OTRO")
        acciones[a] = acciones.get(a, 0) + 1
        t = r.get("tabla_afectada", "desconocida")
        tablas[t] = tablas.get(t, 0) + 1
    return {"por_accion": acciones, "por_tabla": tablas, "total": len(registros)}
