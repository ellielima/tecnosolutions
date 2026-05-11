from core.database import get_db
from typing import Optional


def registrar_auditoria(
    usuario_id: Optional[str],
    tabla_afectada: str,
    accion: str,
    registro_id: str,
    descripcion: str,
    ip_address: Optional[str] = None,
    db=None
):
    if db is None:
        db = get_db()
    try:
        db.table("auditoria").insert({
            "usuario_id": usuario_id,
            "tabla_afectada": tabla_afectada,
            "accion": accion,
            "registro_id": str(registro_id),
            "descripcion": descripcion,
            "ip_address": ip_address
        }).execute()
    except Exception as e:
        print(f"[AUDIT ERROR] {e}")
