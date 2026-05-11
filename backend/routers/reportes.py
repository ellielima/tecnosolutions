from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from core.database import get_db
from core.dependencies import get_current_user, require_admin
from services.pdf_service import (
    generar_pdf_proyecto,
    generar_pdf_tareas_usuario,
    generar_pdf_tareas_general,
    generar_pdf_usuarios
)

router = APIRouter()


@router.get("/proyecto/{proyecto_id}")
def reporte_proyecto(proyecto_id: int, current_user=Depends(require_admin), db=Depends(get_db)):
    proy_result = db.table("proyectos")\
        .select("*, clientes(nombre, empresa), estados_proyecto(nombre)")\
        .eq("id", proyecto_id).single().execute()
    if not proy_result.data:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    proy = proy_result.data
    proy["cliente_nombre"] = (proy.get("clientes") or {}).get("nombre", "—")
    proy["estado_nombre"]  = (proy.get("estados_proyecto") or {}).get("nombre", "—")

    tareas_result = db.table("tareas")\
        .select("*, usuarios!tareas_responsable_id_fkey(nombre), estados_tarea(nombre), prioridades_tarea(nombre)")\
        .eq("proyecto_id", proyecto_id).execute()

    tareas = []
    for t in tareas_result.data:
        t["responsable_nombre"] = (t.get("usuarios") or {}).get("nombre", "—")
        t["estado_nombre"]      = (t.get("estados_tarea") or {}).get("nombre", "—")
        t["prioridad_nombre"]   = (t.get("prioridades_tarea") or {}).get("nombre", "—")
        tareas.append(t)

    pdf_bytes = generar_pdf_proyecto(proy, tareas)
    filename  = f"proyecto_{proyecto_id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/tareas-general")
def reporte_tareas_general(current_user=Depends(require_admin), db=Depends(get_db)):
    """PDF con todas las tareas del sistema (solo admin)."""
    tareas_result = db.table("tareas")\
        .select("*, proyectos(nombre), usuarios!tareas_responsable_id_fkey(nombre), estados_tarea(nombre), prioridades_tarea(nombre)")\
        .order("fecha_limite").execute()

    tareas = []
    for t in tareas_result.data:
        t["proyecto_nombre"]     = (t.get("proyectos") or {}).get("nombre", "—")
        t["responsable_nombre"]  = (t.get("usuarios") or {}).get("nombre", "—")
        t["estado_nombre"]       = (t.get("estados_tarea") or {}).get("nombre", "—")
        t["prioridad_nombre"]    = (t.get("prioridades_tarea") or {}).get("nombre", "—")
        tareas.append(t)

    pdf_bytes = generar_pdf_tareas_general(tareas)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=tareas_general.pdf"}
    )


@router.get("/mis-tareas")
def reporte_mis_tareas(current_user=Depends(get_current_user), db=Depends(get_db)):
    """PDF con las tareas del usuario autenticado."""
    tareas_result = db.table("tareas")\
        .select("*, proyectos(nombre), estados_tarea(nombre), prioridades_tarea(nombre)")\
        .eq("responsable_id", current_user["id"]).execute()

    tareas = []
    for t in tareas_result.data:
        t["proyecto_nombre"]  = (t.get("proyectos") or {}).get("nombre", "—")
        t["estado_nombre"]    = (t.get("estados_tarea") or {}).get("nombre", "—")
        t["prioridad_nombre"] = (t.get("prioridades_tarea") or {}).get("nombre", "—")
        tareas.append(t)

    pdf_bytes = generar_pdf_tareas_usuario(current_user["nombre"], tareas)
    filename  = f"mis_tareas_{current_user['id'][:8]}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/usuarios")
def reporte_usuarios(current_user=Depends(require_admin), db=Depends(get_db)):
    """PDF con el listado completo de usuarios."""
    result = db.table("usuarios")\
        .select("nombre, correo, telefono, activo, ultimo_login, creado_en, roles(nombre)")\
        .order("creado_en", desc=False).execute()

    usuarios = []
    for u in result.data:
        u["rol_nombre"] = (u.get("roles") or {}).get("nombre", "—")
        usuarios.append(u)

    pdf_bytes = generar_pdf_usuarios(usuarios)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=listado_usuarios.pdf"}
    )
