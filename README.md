# TecnoSolutions — Sistema de Gestión Empresarial

Sistema web full-stack para gestión de clientes, proyectos, tareas y usuarios con auditoría completa.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend | Python 3.11 + FastAPI |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | JWT (access + refresh tokens) |
| Gráficas | Recharts |
| PDF | ReportLab |
| Deploy Frontend | Vercel |
| Deploy Backend | Render |

---

## Estructura del Proyecto

```
tecnosolutions/
├── frontend/               # Next.js 14
│   ├── app/
│   │   ├── login/          # Login + recuperación contraseña
│   │   ├── dashboard/      # KPIs + gráficas
│   │   ├── clientes/       # CRUD clientes
│   │   ├── proyectos/      # CRUD proyectos + PDF
│   │   ├── tareas/         # CRUD tareas + progreso
│   │   ├── usuarios/       # Admin: gestión de usuarios
│   │   └── auditoria/      # Admin: log de actividad
│   ├── components/
│   │   └── layout/         # Sidebar, AppLayout (auth guard)
│   ├── hooks/useAuth.tsx    # Contexto de autenticación
│   └── lib/api.ts          # Axios con interceptores JWT
│
└── backend/                # FastAPI
    ├── main.py
    ├── core/
    │   ├── config.py        # Variables de entorno
    │   ├── database.py      # Cliente Supabase
    │   ├── security.py      # JWT, bcrypt, tokens
    │   └── dependencies.py  # Guards de autenticación
    ├── routers/
    │   ├── auth.py          # Login, refresh, recuperar contraseña
    │   ├── usuarios.py
    │   ├── clientes.py
    │   ├── proyectos.py
    │   ├── tareas.py
    │   ├── auditoria.py
    │   └── reportes.py      # PDF de proyectos y tareas
    └── services/
        ├── email_service.py  # SMTP para recuperación
        ├── pdf_service.py    # ReportLab
        └── audit_service.py  # Registro de auditoría
```

---

## Instalación Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/tecnosolutions.git
cd tecnosolutions
```

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Editar .env con tus credenciales de Supabase
```

#### Variables de entorno del backend (`.env`)
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...        # service_role key
SUPABASE_ANON_KEY=eyJ...
JWT_SECRET=genera_una_clave_segura_aqui
SMTP_USER=tu_correo@gmail.com
SMTP_PASSWORD=tu_app_password_de_gmail
FRONTEND_URL=http://localhost:3000
```

> **Gmail App Password**: Ve a Google Account → Security → 2-Step Verification → App passwords

```bash
uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### 3. Frontend
```bash
cd frontend
npm install

cp .env.local.example .env.local
# Editar con la URL del backend
```

#### Variables de entorno del frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
# App: http://localhost:3000
```

---

## Base de Datos (Supabase)

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** y ejecuta el script completo de la base de datos
3. Copia las credenciales desde **Project Settings → API**:
   - `URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_KEY` (**NUNCA** exponer al frontend)

### Credenciales iniciales
```
Correo:     admin@tecnosolutions.com
Contraseña: Admin123! (cámbiala después del primer login)
```

> El `password_hash` del seed usa bcrypt. Para regenerar:
> ```python
> import bcrypt
> print(bcrypt.hashpw(b"Admin123!", bcrypt.gensalt()).decode())
> ```
> Luego actualiza el hash en Supabase directamente.

---

## Despliegue en Producción

### Backend → Render

1. Crea una cuenta en [render.com](https://render.com)
2. **New → Web Service** → conecta tu repositorio GitHub
3. Configuración:
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Agrega todas las variables de entorno en **Environment**
5. URL resultante: `https://tecnosolutions-api.onrender.com`

### Frontend → Vercel

1. Crea una cuenta en [vercel.com](https://vercel.com)
2. **New Project** → importa el repositorio
3. Configuración:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
4. Agrega la variable de entorno:
   - `NEXT_PUBLIC_API_URL` = `https://tecnosolutions-api.onrender.com`
5. URL resultante: `https://tecnosolutions.vercel.app`

---

## Funcionalidades por Rol

### Administrador
| Módulo | Permisos |
|--------|---------|
| Dashboard | KPIs completos + gráficas de proyectos y tareas |
| Clientes | Crear, ver, editar, eliminar |
| Proyectos | CRUD completo + descarga de PDF |
| Tareas | CRUD completo + actualizar progreso |
| Usuarios | CRUD completo + activar/desactivar |
| Auditoría | Vista completa del log de actividad |

### Empleado
| Módulo | Permisos |
|--------|---------|
| Dashboard | Resumen de sus tareas (pendientes, completadas, atrasadas) |
| Tareas | Solo sus tareas asignadas + actualizar progreso |
| PDF | Descargar reporte de sus propias tareas |

---

## API Endpoints Principales

```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

GET    /api/usuarios/
GET    /api/usuarios/me
POST   /api/usuarios/
PUT    /api/usuarios/{id}
DELETE /api/usuarios/{id}

GET    /api/clientes/
POST   /api/clientes/
PUT    /api/clientes/{id}
DELETE /api/clientes/{id}

GET    /api/proyectos/
POST   /api/proyectos/
PUT    /api/proyectos/{id}
DELETE /api/proyectos/{id}
GET    /api/proyectos/stats/dashboard

GET    /api/tareas/
POST   /api/tareas/
PUT    /api/tareas/{id}
PATCH  /api/tareas/{id}/progreso
DELETE /api/tareas/{id}

GET    /api/auditoria/
GET    /api/auditoria/stats

GET    /api/reportes/proyecto/{id}     # PDF del proyecto
GET    /api/reportes/mis-tareas        # PDF de tareas del usuario
```

Documentación interactiva: `http://localhost:8000/docs`

---

## Seguridad

- Contraseñas hasheadas con **bcrypt**
- Autenticación con **JWT** (access token 60min + refresh token 7 días)
- **Row Level Security (RLS)** activado en Supabase
- La `service_role key` solo existe en el backend — nunca llega al cliente
- Recuperación de contraseña con **token seguro + código de 6 dígitos**, expira en 15 minutos
- Auditoría automática vía **triggers PostgreSQL** + registro manual en cada endpoint

---

## Tecnologías de Terceros

- [Supabase](https://supabase.com) — base de datos en la nube
- [Vercel](https://vercel.com) — hosting del frontend (gratuito)
- [Render](https://render.com) — hosting del backend (gratuito)
- [ReportLab](https://www.reportlab.com) — generación de PDFs
- [Recharts](https://recharts.org) — gráficas

---

## Entregables

- [x] Código fuente frontend (Next.js)
- [x] Código fuente backend (FastAPI)
- [x] Base de datos en Supabase (PostgreSQL)
- [x] Autenticación JWT con recuperación por correo
- [x] CRUD completo de clientes, proyectos, tareas y usuarios
- [x] Roles: Administrador y Empleado
- [x] Generación de PDFs (proyectos y tareas)
- [x] Auditoría completa (triggers + log manual)
- [x] Gráficas y métricas en el dashboard
- [x] Diseño responsivo y moderno
- [x] README con instrucciones de despliegue
