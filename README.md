TecnoSolutions S.A. — Sistema de Gestión Empresarial
Sistema web full-stack para gestión de clientes, proyectos, tareas y usuarios con auditoría completa, reportes PDF y acceso desde dispositivos móviles.
🌐 URLs del Sistema
ServicioURLFrontend (Vercel)https://tecnosolutions.vercel.appBackend API (Railway)https://truthful-success-production-78c5.up.railway.appDocumentación APIhttps://truthful-success-production-78c5.up.railway.app/docs

🛠️ Stack Tecnológico
CapaTecnologíaFrontendNext.js 14 + TypeScriptEstilosTailwind CSSBackendPython 3.11 + FastAPIBase de datosSupabase (PostgreSQL)AutenticaciónJWT (access + refresh tokens)GráficasRechartsPDFReportLabEmailResend APIDeploy FrontendVercelDeploy BackendRailway

📁 Estructura del Proyecto
tecnosolutions/
├── frontend/               # Next.js 14
│   ├── app/
│   │   ├── login/          # Login + recuperación de contraseña
│   │   ├── dashboard/      # KPIs + gráficas
│   │   ├── clientes/       # CRUD clientes
│   │   ├── proyectos/      # CRUD proyectos + PDF
│   │   ├── tareas/         # CRUD tareas + progreso
│   │   ├── usuarios/       # Gestión de usuarios (admin)
│   │   ├── auditoria/      # Log de actividad (admin)
│   │   └── rendimiento/    # Métricas por empleado (admin)
│   ├── components/layout/  # Sidebar y AppLayout
│   ├── hooks/useAuth.tsx   # Contexto de autenticación
│   ├── lib/api.ts          # Axios con interceptores JWT
│   └── public/
│       └── manifest.json   # Configuración PWA
│
└── backend/                # FastAPI
    ├── main.py
    ├── core/               # Config, DB, seguridad, guards
    ├── routers/            # auth, usuarios, clientes, proyectos, tareas, auditoria, reportes
    └── services/           # email, pdf, audit

🚀 Instalación Local
Requisitos

Node.js 18+
Python 3.11+
Cuenta en Supabase con la base de datos creada

Backend
bashcd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
# Copiar .env.example a .env y llenar credenciales
uvicorn main:app --reload --port 8000
Frontend
bashcd frontend
npm install
# Copiar .env.local.example a .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
Abrir en el navegador: http://localhost:3000

⚙️ Variables de Entorno
Backend (.env)
envSUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
JWT_SECRET=clave_secreta_larga
RESEND_API_KEY=re_xxxx
FRONTEND_URL=https://tecnosolutions.vercel.app
ALLOWED_ORIGINS=["https://tecnosolutions.vercel.app"]
Frontend (.env.local)
envNEXT_PUBLIC_API_URL=https://truthful-success-production-78c5.up.railway.app

👥 Roles y Permisos
Administrador

Dashboard con KPIs y gráficas completas
CRUD de clientes, proyectos, tareas y usuarios
Generación de reportes PDF
Visualización de métricas de rendimiento por empleado
Acceso al log de auditoría

Empleado

Dashboard con resumen de sus tareas
Ver y actualizar el progreso de sus tareas asignadas
Descargar PDF de sus propias tareas


📋 API Endpoints Principales
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET/POST/PUT/DELETE   /api/usuarios/
GET/POST/PUT/DELETE   /api/clientes/
GET/POST/PUT/DELETE   /api/proyectos/
GET/POST/PUT/DELETE   /api/tareas/
PATCH                 /api/tareas/{id}/progreso

GET    /api/auditoria/
GET    /api/reportes/proyecto/{id}
GET    /api/reportes/tareas-general
GET    /api/reportes/mis-tareas
GET    /api/reportes/usuarios
Documentación interactiva: /docs

🔒 Seguridad

Contraseñas hasheadas con bcrypt
Autenticación con JWT (access 60min + refresh 7 días)
Row Level Security (RLS) activado en Supabase
Recuperación de contraseña con código de 6 dígitos (expira en 15 min)
Auditoría automática vía triggers PostgreSQL


📱 Aplicación Móvil (PWA)
Configurado como Progressive Web App instalable:

Android: Chrome → tres puntos → "Agregar a pantalla de inicio"
iPhone: Safari → compartir → "Añadir a pantalla de inicio"
APK Android disponible generado con PWABuilder


📦 Entregables

 Código fuente frontend y backend
 Base de datos en Supabase
 Autenticación JWT con recuperación por correo
 CRUD completo con roles
 Generación de PDFs
 Auditoría completa
 Gráficas y métricas de rendimiento
 Diseño responsivo + PWA
 Desplegado en Vercel + Railway
 Manual de usuario y documentación técnica


👩‍💻 Desarrollado por
Elizabeth Lima — TecnoSolutions S.A.
Sistema de Gestión Empresarial — 2026
