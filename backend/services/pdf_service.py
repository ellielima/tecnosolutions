from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io
from datetime import datetime


PURPLE = colors.HexColor("#6366f1")
DARK   = colors.HexColor("#0f172a")
SLATE  = colors.HexColor("#1e293b")
LIGHT  = colors.HexColor("#f1f5f9")
MUTED  = colors.HexColor("#64748b")
GREEN  = colors.HexColor("#10b981")
AMBER  = colors.HexColor("#f59e0b")
RED    = colors.HexColor("#ef4444")


def _estado_color(estado: str) -> colors.Color:
    e = estado.lower()
    if "complet" in e or "finaliz" in e:  return GREEN
    if "progres" in e:                     return AMBER
    if "atras" in e or "cancel" in e:      return RED
    return MUTED


def generar_pdf_proyecto(proyecto: dict, tareas: list) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )
    styles = getSampleStyleSheet()
    story = []

    # ── Header ───────────────────────────────────────────────────────────────
    title_style = ParagraphStyle("Title", fontSize=22, textColor=PURPLE,
                                  spaceAfter=4, fontName="Helvetica-Bold")
    sub_style   = ParagraphStyle("Sub",   fontSize=10, textColor=MUTED,
                                  spaceAfter=2)
    body_style  = ParagraphStyle("Body",  fontSize=10, textColor=DARK,
                                  spaceAfter=6, leading=14)
    label_style = ParagraphStyle("Label", fontSize=9,  textColor=MUTED,
                                  spaceAfter=2, fontName="Helvetica-Bold")

    story.append(Paragraph("TecnoSolutions S.A.", sub_style))
    story.append(Paragraph(f"Reporte de Proyecto", title_style))
    story.append(HRFlowable(width="100%", thickness=2, color=PURPLE, spaceAfter=12))

    # ── Datos del proyecto ───────────────────────────────────────────────────
    meta = [
        ["Proyecto",    proyecto.get("nombre", "—")],
        ["Cliente",     proyecto.get("cliente_nombre", "—")],
        ["Estado",      proyecto.get("estado_nombre", "—")],
        ["Inicio",      str(proyecto.get("fecha_inicio", "—"))],
        ["Fin",         str(proyecto.get("fecha_fin", "—"))],
        ["Presupuesto", f"${proyecto.get('presupuesto', 0):,.2f}" if proyecto.get("presupuesto") else "—"],
    ]
    meta_table = Table(meta, colWidths=[4*cm, 12*cm])
    meta_table.setStyle(TableStyle([
        ("FONTNAME",    (0,0), (0,-1), "Helvetica-Bold"),
        ("FONTSIZE",    (0,0), (-1,-1), 9),
        ("TEXTCOLOR",   (0,0), (0,-1), MUTED),
        ("TEXTCOLOR",   (1,0), (1,-1), DARK),
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [LIGHT, colors.white]),
        ("PADDING",     (0,0), (-1,-1), 6),
        ("GRID",        (0,0), (-1,-1), 0.3, colors.HexColor("#e2e8f0")),
        ("ROUNDEDCORNERS", (0,0), (-1,-1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 0.5*cm))

    if proyecto.get("descripcion"):
        story.append(Paragraph("Descripción", label_style))
        story.append(Paragraph(proyecto["descripcion"], body_style))

    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(f"Tareas ({len(tareas)})", ParagraphStyle(
        "SectionTitle", fontSize=13, textColor=SLATE,
        fontName="Helvetica-Bold", spaceAfter=8
    )))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceAfter=8))

    # ── Tabla de tareas ───────────────────────────────────────────────────────
    if tareas:
        header = ["#", "Tarea", "Responsable", "Prioridad", "Estado", "Avance", "Límite"]
        rows = [header]
        for i, t in enumerate(tareas, 1):
            rows.append([
                str(i),
                t.get("titulo", "—"),
                t.get("responsable_nombre", "—"),
                t.get("prioridad_nombre", "—"),
                t.get("estado_nombre", "—"),
                f"{t.get('porcentaje_avance', 0)}%",
                str(t.get("fecha_limite", "—")),
            ])
        task_table = Table(rows, colWidths=[0.8*cm, 4.5*cm, 3*cm, 2*cm, 2.5*cm, 1.5*cm, 2.2*cm])
        task_table.setStyle(TableStyle([
            ("BACKGROUND",   (0,0), (-1,0), PURPLE),
            ("TEXTCOLOR",    (0,0), (-1,0), colors.white),
            ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",     (0,0), (-1,-1), 8),
            ("ALIGN",        (0,0), (-1,-1), "CENTER"),
            ("ALIGN",        (1,1), (1,-1), "LEFT"),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [LIGHT, colors.white]),
            ("GRID",         (0,0), (-1,-1), 0.3, colors.HexColor("#e2e8f0")),
            ("PADDING",      (0,0), (-1,-1), 5),
        ]))
        story.append(task_table)
    else:
        story.append(Paragraph("No hay tareas registradas para este proyecto.", body_style))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 1*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=MUTED))
    story.append(Paragraph(
        f"Generado el {datetime.now().strftime('%d/%m/%Y %H:%M')} — TecnoSolutions S.A.",
        ParagraphStyle("Footer", fontSize=8, textColor=MUTED, alignment=TA_CENTER)
    ))

    doc.build(story)
    return buffer.getvalue()


def generar_pdf_tareas_usuario(usuario_nombre: str, tareas: list) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm,
                             topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("TecnoSolutions S.A.", ParagraphStyle(
        "Sub", fontSize=10, textColor=MUTED)))
    story.append(Paragraph(f"Tareas de {usuario_nombre}", ParagraphStyle(
        "Title", fontSize=20, textColor=PURPLE, fontName="Helvetica-Bold", spaceAfter=4)))
    story.append(HRFlowable(width="100%", thickness=2, color=PURPLE, spaceAfter=12))

    header = ["#", "Tarea", "Proyecto", "Estado", "Prioridad", "Avance", "Fecha Límite"]
    rows = [header]
    for i, t in enumerate(tareas, 1):
        rows.append([
            str(i),
            t.get("titulo", "—"),
            t.get("proyecto_nombre", "—"),
            t.get("estado_nombre", "—"),
            t.get("prioridad_nombre", "—"),
            f"{t.get('porcentaje_avance', 0)}%",
            str(t.get("fecha_limite", "—")),
        ])

    table = Table(rows, colWidths=[0.8*cm, 4.5*cm, 3*cm, 2.5*cm, 2*cm, 1.5*cm, 2.2*cm])
    table.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,0), PURPLE),
        ("TEXTCOLOR",    (0,0), (-1,0), colors.white),
        ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0), (-1,-1), 8),
        ("ALIGN",        (0,0), (-1,-1), "CENTER"),
        ("ALIGN",        (1,1), (1,-1), "LEFT"),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [LIGHT, colors.white]),
        ("GRID",         (0,0), (-1,-1), 0.3, colors.HexColor("#e2e8f0")),
        ("PADDING",      (0,0), (-1,-1), 5),
    ]))
    story.append(table)

    story.append(Spacer(1, 1*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=MUTED))
    story.append(Paragraph(
        f"Generado el {datetime.now().strftime('%d/%m/%Y %H:%M')} — TecnoSolutions S.A.",
        ParagraphStyle("Footer", fontSize=8, textColor=MUTED, alignment=TA_CENTER)
    ))

    doc.build(story)
    return buffer.getvalue()


def generar_pdf_tareas_general(tareas: list) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    story = []
    story.append(Paragraph("TecnoSolutions S.A.", ParagraphStyle("Sub", fontSize=10, textColor=MUTED)))
    story.append(Paragraph("Reporte General de Tareas", ParagraphStyle("Title", fontSize=20, textColor=PURPLE, fontName="Helvetica-Bold", spaceAfter=4)))
    story.append(HRFlowable(width="100%", thickness=2, color=PURPLE, spaceAfter=12))
    total = len(tareas)
    completadas = sum(1 for t in tareas if 'complet' in (t.get('estado_nombre') or '').lower())
    atrasadas = sum(1 for t in tareas if 'atras' in (t.get('estado_nombre') or '').lower())
    en_progreso = sum(1 for t in tareas if 'progres' in (t.get('estado_nombre') or '').lower())
    resumen = [["Total tareas", str(total)], ["Completadas", str(completadas)], ["En progreso", str(en_progreso)], ["Atrasadas", str(atrasadas)]]
    rt = Table(resumen, colWidths=[4*cm, 4*cm])
    rt.setStyle(TableStyle([("FONTNAME",(0,0),(0,-1),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),9),("TEXTCOLOR",(0,0),(0,-1),MUTED),("TEXTCOLOR",(1,0),(1,-1),DARK),("ROWBACKGROUNDS",(0,0),(-1,-1),[LIGHT,colors.white]),("PADDING",(0,0),(-1,-1),6),("GRID",(0,0),(-1,-1),0.3,colors.HexColor("#e2e8f0"))]))
    story.append(rt)
    story.append(Spacer(1, 0.5*cm))
    header = ["#", "Tarea", "Proyecto", "Responsable", "Estado", "Prioridad", "Avance", "Limite"]
    rows = [header]
    for i, t in enumerate(tareas, 1):
        rows.append([str(i), t.get("titulo","—"), t.get("proyecto_nombre","—"), t.get("responsable_nombre","—"), t.get("estado_nombre","—"), t.get("prioridad_nombre","—"), f"{t.get('porcentaje_avance',0)}%", str(t.get("fecha_limite","—"))])
    table = Table(rows, colWidths=[0.7*cm, 3.5*cm, 2.8*cm, 2.8*cm, 2*cm, 1.8*cm, 1.3*cm, 2.1*cm])
    table.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),PURPLE),("TEXTCOLOR",(0,0),(-1,0),colors.white),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),7.5),("ALIGN",(0,0),(-1,-1),"CENTER"),("ALIGN",(1,1),(2,-1),"LEFT"),("ROWBACKGROUNDS",(0,1),(-1,-1),[LIGHT,colors.white]),("GRID",(0,0),(-1,-1),0.3,colors.HexColor("#e2e8f0")),("PADDING",(0,0),(-1,-1),4)]))
    story.append(table)
    story.append(Spacer(1, 1*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=MUTED))
    story.append(Paragraph(f"Generado el {datetime.now().strftime('%d/%m/%Y %H:%M')} — TecnoSolutions S.A.", ParagraphStyle("Footer", fontSize=8, textColor=MUTED, alignment=TA_CENTER)))
    doc.build(story)
    return buffer.getvalue()


def generar_pdf_usuarios(usuarios: list) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    story = []
    story.append(Paragraph("TecnoSolutions S.A.", ParagraphStyle("Sub", fontSize=10, textColor=MUTED)))
    story.append(Paragraph("Listado de Usuarios", ParagraphStyle("Title", fontSize=20, textColor=PURPLE, fontName="Helvetica-Bold", spaceAfter=4)))
    story.append(HRFlowable(width="100%", thickness=2, color=PURPLE, spaceAfter=12))
    header = ["#", "Nombre", "Correo", "Rol", "Estado", "Telefono"]
    rows = [header]
    for i, u in enumerate(usuarios, 1):
        rows.append([str(i), u.get("nombre","—"), u.get("correo","—"), u.get("rol_nombre","—"), "Activo" if u.get("activo") else "Inactivo", u.get("telefono") or "—"])
    table = Table(rows, colWidths=[0.8*cm, 4*cm, 5*cm, 2.5*cm, 2*cm, 2.7*cm])
    table.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),PURPLE),("TEXTCOLOR",(0,0),(-1,0),colors.white),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),8),("ALIGN",(0,0),(-1,-1),"CENTER"),("ALIGN",(1,1),(2,-1),"LEFT"),("ROWBACKGROUNDS",(0,1),(-1,-1),[LIGHT,colors.white]),("GRID",(0,0),(-1,-1),0.3,colors.HexColor("#e2e8f0")),("PADDING",(0,0),(-1,-1),5)]))
    story.append(table)
    story.append(Spacer(1, 1*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=MUTED))
    story.append(Paragraph(f"Generado el {datetime.now().strftime('%d/%m/%Y %H:%M')} — TecnoSolutions S.A.", ParagraphStyle("Footer", fontSize=8, textColor=MUTED, alignment=TA_CENTER)))
    doc.build(story)
    return buffer.getvalue()
