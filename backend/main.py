from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, usuarios, clientes, proyectos, tareas, auditoria, reportes
from core.config import settings

app = FastAPI(
    title="TecnoSolutions API",
    description="API REST para sistema de gestión empresarial TecnoSolutions S.A.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,       prefix="/api/auth",      tags=["Autenticación"])
app.include_router(usuarios.router,   prefix="/api/usuarios",  tags=["Usuarios"])
app.include_router(clientes.router,   prefix="/api/clientes",  tags=["Clientes"])
app.include_router(proyectos.router,  prefix="/api/proyectos", tags=["Proyectos"])
app.include_router(tareas.router,     prefix="/api/tareas",    tags=["Tareas"])
app.include_router(auditoria.router,  prefix="/api/auditoria", tags=["Auditoría"])
app.include_router(reportes.router,   prefix="/api/reportes",  tags=["Reportes"])

@app.get("/")
def root():
    return {"status": "ok", "message": "TecnoSolutions API v1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}
