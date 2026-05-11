'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Search, Loader2, X, Shield, User, Eye, EyeOff, FileDown } from 'lucide-react'
import clsx from 'clsx'

type Usuario = {
  id: string; nombre: string; correo: string; telefono: string;
  activo: boolean; rol_id: number; ultimo_login: string; creado_en: string;
  roles?: { nombre: string }
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<null | 'create' | 'edit'>(null)
  const [editing, setEditing] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const load = async () => {
    const [u, r] = await Promise.all([api.get('/api/usuarios/'), api.get('/api/usuarios/roles/lista')])
    setUsuarios(u.data); setRoles(r.data); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = usuarios.filter(u =>
    u.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    u.correo?.toLowerCase().includes(search.toLowerCase())
  )

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!editing.nombre?.trim()) errs.nombre = 'El nombre es requerido'
    if (!editing.correo?.trim()) {
      errs.correo = 'El correo es requerido'
    } else if (!emailRegex.test(editing.correo)) {
      errs.correo = 'El correo no es válido (ej: usuario@empresa.com)'
    }
    if (modal === 'create') {
      if (!editing.password) errs.password = 'La contraseña es requerida'
      else if (editing.password.length < 8) errs.password = 'Mínimo 8 caracteres'
      // Verificar duplicado
      const existe = usuarios.find(u => u.correo?.toLowerCase() === editing.correo?.toLowerCase())
      if (existe) errs.correo = 'Este correo ya está registrado'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const save = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (modal === 'create') {
        await api.post('/api/usuarios/', editing)
        toast.success('Usuario creado correctamente')
      } else {
        await api.put(`/api/usuarios/${editing.id}`, editing)
        toast.success('Usuario actualizado correctamente')
      }
      setModal(null); setErrors({}); load()
    } catch (e: any) {
      const detail = e.response?.data?.detail
      if (typeof detail === 'string' && detail.includes('correo')) {
        setErrors({ correo: 'Este correo ya está registrado' })
      } else {
        toast.error(typeof detail === 'string' ? detail : 'Error al guardar')
      }
    } finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return
    try { await api.delete(`/api/usuarios/${id}`); toast.success('Usuario eliminado'); load() }
    catch (e: any) { toast.error(e.response?.data?.detail || 'Error al eliminar') }
  }

  const toggleActivo = async (u: Usuario) => {
    try {
      await api.put(`/api/usuarios/${u.id}`, { activo: !u.activo })
      toast.success(u.activo ? 'Usuario desactivado' : 'Usuario activado')
      load()
    } catch { toast.error('Error al cambiar estado') }
  }

  const downloadPDF = async () => {
    try {
      const res = await api.get('/api/reportes/usuarios', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url; a.download = 'listado_usuarios.pdf'; a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF descargado correctamente')
    } catch { toast.error('Error al generar el PDF') }
  }

  const openCreate = () => {
    setEditing({ activo: true, rol_id: 2 })
    setErrors({})
    setShowPwd(false)
    setModal('create')
  }

  const openEdit = (u: Usuario) => {
    setEditing({ ...u })
    setErrors({})
    setModal('edit')
  }

  return (
    <AppLayout>
      <div className="space-y-5 animate-slide-up">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-white">Usuarios</h1>
            <p className="text-surface-400 text-sm mt-0.5">{usuarios.length} usuarios registrados</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={downloadPDF} className="btn-secondary flex items-center gap-2 text-sm">
              <FileDown className="w-4 h-4" /> Exportar PDF
            </button>
            <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Nuevo usuario
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-9 text-sm" placeholder="Buscar por nombre o correo..." />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="flex flex-col gap-3 sm:hidden">
              {filtered.length === 0 ? (
                <p className="text-center py-10 text-surface-500">No hay usuarios.</p>
              ) : filtered.map(u => (
                <div key={u.id} className="card p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                      u.roles?.nombre === 'Administrador' ? 'bg-brand-500/20' : 'bg-surface-700')}>
                      {u.roles?.nombre === 'Administrador'
                        ? <Shield className="w-4 h-4 text-brand-400" />
                        : <User className="w-4 h-4 text-surface-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-100 truncate">{u.nombre}</p>
                      <p className="text-xs text-surface-400 truncate">{u.correo}</p>
                    </div>
                    <button onClick={() => toggleActivo(u)}
                      className={clsx('badge cursor-pointer', u.activo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400')}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={clsx('badge text-xs', u.roles?.nombre === 'Administrador' ? 'bg-brand-500/15 text-brand-400' : 'bg-surface-700 text-surface-300')}>
                      {u.roles?.nombre}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-surface-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(u.id)} className="p-1.5 rounded-lg text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block table-wrapper">
              <table>
                <thead>
                  <tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Último login</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-surface-500">No hay usuarios.</td></tr>
                  ) : filtered.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            u.roles?.nombre === 'Administrador' ? 'bg-brand-500/20' : 'bg-surface-700')}>
                            {u.roles?.nombre === 'Administrador'
                              ? <Shield className="w-4 h-4 text-brand-400" />
                              : <User className="w-4 h-4 text-surface-400" />}
                          </div>
                          <span className="font-medium">{u.nombre}</span>
                        </div>
                      </td>
                      <td className="text-surface-400 text-xs">{u.correo}</td>
                      <td>
                        <span className={clsx('badge', u.roles?.nombre === 'Administrador'
                          ? 'bg-brand-500/15 text-brand-400' : 'bg-surface-700 text-surface-300')}>
                          {u.roles?.nombre || '—'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => toggleActivo(u)}
                          className={clsx('badge cursor-pointer transition-all', u.activo
                            ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                            : 'bg-red-500/15 text-red-400 hover:bg-red-500/25')}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="text-surface-500 text-xs">
                        {u.ultimo_login
                          ? new Date(u.ultimo_login).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(u)}
                            className="p-1.5 rounded-lg text-surface-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => remove(u.id)}
                            className="p-1.5 rounded-lg text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="card w-full max-w-md p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-white">
                {modal === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
              </h2>
              <button onClick={() => setModal(null)}
                className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Nombre completo *</label>
                <input value={editing.nombre||''} onChange={e => setEditing({...editing, nombre: e.target.value})}
                  className={clsx('input text-sm', errors.nombre && 'border-red-500 focus:ring-red-500')}
                  placeholder="Nombre y apellido" />
                {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
              </div>

              {/* Correo */}
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Correo electrónico *</label>
                <input value={editing.correo||''} onChange={e => setEditing({...editing, correo: e.target.value})}
                  className={clsx('input text-sm', errors.correo && 'border-red-500 focus:ring-red-500')}
                  placeholder="usuario@empresa.com" disabled={modal === 'edit'} />
                {errors.correo && <p className="text-red-400 text-xs mt-1">{errors.correo}</p>}
              </div>

              {/* Contraseña (solo al crear) */}
              {modal === 'create' && (
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1">Contraseña *</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'}
                      value={editing.password||''} onChange={e => setEditing({...editing, password: e.target.value})}
                      className={clsx('input text-sm pr-10', errors.password && 'border-red-500 focus:ring-red-500')}
                      placeholder="Mínimo 8 caracteres" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200 transition-colors">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                </div>
              )}

              {/* Teléfono */}
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Teléfono</label>
                <input value={editing.telefono||''} onChange={e => setEditing({...editing, telefono: e.target.value})}
                  className="input text-sm" placeholder="555-0000" />
              </div>

              {/* Rol */}
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Rol</label>
                <select value={editing.rol_id||''} onChange={e => setEditing({...editing, rol_id: +e.target.value})} className="input text-sm">
                  {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>

              {/* Estado (solo al editar) */}
              {modal === 'edit' && (
                <div className="flex items-center gap-3 pt-1">
                  <label className="text-xs font-medium text-surface-400">Estado</label>
                  <button type="button" onClick={() => setEditing({...editing, activo: !editing.activo})}
                    className={clsx('badge cursor-pointer transition-all', editing.activo
                      ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-red-500/15 text-red-400 hover:bg-red-500/25')}>
                    {editing.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {modal === 'create' ? 'Crear usuario' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
