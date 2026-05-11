'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import {
  Plus, Pencil, Trash2, Search, Loader2, X,
  FileDown, Clock, AlertTriangle, TrendingUp
} from 'lucide-react'
import clsx from 'clsx'

type Tarea = {
  id: number; titulo: string; descripcion: string; proyecto_id: number; responsable_id: string;
  prioridad_id: number; estado_id: number; fecha_inicio: string; fecha_limite: string;
  fecha_finalizacion: string; porcentaje_avance: number; horas_estimadas: number; horas_reales: number;
  proyectos?: { nombre: string }
  usuarios?: { nombre: string }
  estados_tarea?: { nombre: string }
  prioridades_tarea?: { nombre: string }
  _atrasada?: boolean
}

const estadoColor: Record<string, string> = {
  'Pendiente':   'bg-surface-700 text-surface-300',
  'En progreso': 'bg-brand-500/15 text-brand-400',
  'Completada':  'bg-emerald-500/15 text-emerald-400',
  'Atrasada':    'bg-red-500/15 text-red-400',
}
const prioColor: Record<string, string> = {
  'Baja':    'bg-slate-500/15 text-slate-400',
  'Media':   'bg-yellow-500/15 text-yellow-400',
  'Alta':    'bg-orange-500/15 text-orange-400',
  'Urgente': 'bg-red-500/15 text-red-400',
}

export default function TareasPage() {
  const { isAdmin } = useAuth()
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [proyectos, setProyectos] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [estados, setEstados] = useState<any[]>([])
  const [prioridades, setPrioridades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<null | 'create' | 'edit' | 'progress'>(null)
  const [editing, setEditing] = useState<any>({})
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    // Tareas, estados y prioridades — siempre necesarios para admin y empleado
    try {
      const [t, e, p] = await Promise.all([
        api.get('/api/tareas/'),
        api.get('/api/tareas/estados/lista'),
        api.get('/api/tareas/prioridades/lista'),
      ])
      setTareas(t.data)
      setEstados(e.data)
      setPrioridades(p.data)
    } catch {
      toast.error('Error al cargar las tareas')
    } finally {
      setLoading(false)
    }

    // Proyectos y usuarios — solo admin, falla silenciosamente
    if (isAdmin) {
      try {
        const [proy, usrs] = await Promise.all([
          api.get('/api/proyectos/'),
          api.get('/api/usuarios/'),
        ])
        setProyectos(proy.data)
        setUsuarios(usrs.data)
      } catch {
        // no mostrar error, las tareas ya cargaron bien
      }
    }
  }

  useEffect(() => { load() }, [isAdmin])

  const filtered = tareas.filter(t =>
    t.titulo?.toLowerCase().includes(search.toLowerCase()) ||
    t.proyectos?.nombre?.toLowerCase().includes(search.toLowerCase())
  )

  const save = async () => {
    if (!editing.titulo) return toast.error('El título es requerido')
    if (!editing.proyecto_id) return toast.error('Debes seleccionar un proyecto')
    setSaving(true)
    try {
      if (modal === 'create') {
        await api.post('/api/tareas/', editing)
        toast.success('Tarea creada correctamente')
      } else {
        await api.put(`/api/tareas/${editing.id}`, editing)
        toast.success('Tarea actualizada correctamente')
      }
      setModal(null)
      load()
    } catch (e: any) {
      const detail = e.response?.data?.detail
      if (Array.isArray(detail)) {
        toast.error(detail.map((d: any) => d.msg).join(', '))
      } else {
        toast.error(typeof detail === 'string' ? detail : 'Error al guardar la tarea')
      }
    } finally { setSaving(false) }
  }

  const saveProgress = async () => {
    if (editing.porcentaje_avance < 0 || editing.porcentaje_avance > 100) {
      return toast.error('El avance debe estar entre 0 y 100')
    }
    setSaving(true)
    try {
      await api.patch(`/api/tareas/${editing.id}/progreso`, {
        porcentaje_avance: Number(editing.porcentaje_avance),
        estado_id: Number(editing.estado_id),
        horas_reales: editing.horas_reales ? Number(editing.horas_reales) : null,
        fecha_finalizacion: editing.fecha_finalizacion || null,
      })
      toast.success('Progreso actualizado correctamente')
      setModal(null)
      load()
    } catch (e: any) {
      const detail = e.response?.data?.detail
      toast.error(typeof detail === 'string' ? detail : 'Error al actualizar el progreso')
    } finally { setSaving(false) }
  }

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar esta tarea?')) return
    try {
      await api.delete(`/api/tareas/${id}`)
      toast.success('Tarea eliminada')
      load()
    } catch { toast.error('Error al eliminar la tarea') }
  }

  const downloadPDF = async () => {
    try {
      const endpoint = isAdmin ? '/api/reportes/tareas-general' : '/api/reportes/mis-tareas'
      const res = await api.get(endpoint, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = isAdmin ? 'tareas_general.pdf' : 'mis_tareas.pdf'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF descargado correctamente')
    } catch { toast.error('Error al generar el PDF') }
  }

  const openProgress = (t: Tarea) => {
    setEditing({
      id: t.id,
      titulo: t.titulo,
      porcentaje_avance: t.porcentaje_avance ?? 0,
      estado_id: t.estado_id ?? 1,
      horas_reales: t.horas_reales ?? '',
      fecha_finalizacion: t.fecha_finalizacion ?? '',
    })
    setModal('progress')
  }

  const atrasadasCount = tareas.filter(
    t => t._atrasada || t.estados_tarea?.nombre === 'Atrasada'
  ).length

  return (
    <AppLayout>
      <div className="space-y-5 animate-slide-up">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-white">
              {isAdmin ? 'Tareas' : 'Mis Tareas'}
            </h1>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <p className="text-surface-400 text-sm">{tareas.length} tareas</p>
              {atrasadasCount > 0 && (
                <span className="badge bg-red-500/15 text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {atrasadasCount} atrasadas
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={downloadPDF} className="btn-secondary flex items-center gap-2 text-sm">
              <FileDown className="w-4 h-4" /> Exportar PDF
            </button>
            {isAdmin && (
              <button
                onClick={() => {
                  setEditing({ porcentaje_avance: 0, prioridad_id: 2, estado_id: 1 })
                  setModal('create')
                }}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> Nueva tarea
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 text-sm"
            placeholder="Buscar tareas..."
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="flex flex-col gap-3 sm:hidden">
              {filtered.length === 0 ? (
                <p className="text-center py-10 text-surface-500">No hay tareas.</p>
              ) : filtered.map(t => {
                const atrasada = t._atrasada || t.estados_tarea?.nombre === 'Atrasada'
                return (
                  <div key={t.id} className={clsx('card p-4 space-y-3', atrasada && 'border-red-500/30 bg-red-500/5')}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {atrasada && <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                          <p className="font-medium text-surface-100 truncate">{t.titulo}</p>
                        </div>
                        <p className="text-xs text-surface-400 mt-0.5">{t.proyectos?.nombre || '—'}</p>
                      </div>
                      <span className={clsx('badge text-xs flex-shrink-0', estadoColor[t.estados_tarea?.nombre || ''] || 'bg-surface-700 text-surface-300')}>
                        {t.estados_tarea?.nombre || '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-surface-700 rounded-full h-1.5">
                        <div className={clsx('h-1.5 rounded-full transition-all', t.porcentaje_avance === 100 ? 'bg-emerald-500' : 'bg-brand-500')}
                          style={{ width: `${t.porcentaje_avance ?? 0}%` }} />
                      </div>
                      <span className="text-xs text-surface-400 w-8 text-right">{t.porcentaje_avance ?? 0}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={clsx('badge text-xs', prioColor[t.prioridades_tarea?.nombre || ''] || 'bg-surface-700 text-surface-400')}>
                          {t.prioridades_tarea?.nombre || '—'}
                        </span>
                        {t.fecha_limite && (
                          <span className={clsx('text-xs flex items-center gap-1', atrasada ? 'text-red-400' : 'text-surface-400')}>
                            <Clock className="w-3 h-3" />{t.fecha_limite}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openProgress(t)}
                          className="p-1.5 rounded-lg text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
                          <TrendingUp className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && <>
                          <button onClick={() => { setEditing({ ...t }); setModal('edit') }}
                            className="p-1.5 rounded-lg text-surface-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => remove(t.id)}
                            className="p-1.5 rounded-lg text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop: tabla */}
            <div className="hidden sm:block table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Tarea</th><th>Proyecto</th>
                    {isAdmin && <th>Responsable</th>}
                    <th>Prioridad</th><th>Estado</th><th>Avance</th><th>Límite</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={isAdmin ? 8 : 7} className="text-center py-10 text-surface-500">No hay tareas.</td></tr>
                  ) : filtered.map(t => {
                    const atrasada = t._atrasada || t.estados_tarea?.nombre === 'Atrasada'
                    return (
                      <tr key={t.id} className={atrasada ? 'bg-red-500/5' : ''}>
                        <td>
                          <div className="flex items-center gap-2">
                            {atrasada && <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                            <span className="font-medium">{t.titulo}</span>
                          </div>
                        </td>
                        <td className="text-surface-400 text-xs">{t.proyectos?.nombre || '—'}</td>
                        {isAdmin && <td className="text-surface-400 text-xs">{t.usuarios?.nombre || '—'}</td>}
                        <td>
                          <span className={clsx('badge text-xs', prioColor[t.prioridades_tarea?.nombre || ''] || 'bg-surface-700 text-surface-400')}>
                            {t.prioridades_tarea?.nombre || '—'}
                          </span>
                        </td>
                        <td>
                          <span className={clsx('badge text-xs', estadoColor[t.estados_tarea?.nombre || ''] || 'bg-surface-700 text-surface-300')}>
                            {t.estados_tarea?.nombre || '—'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <div className="flex-1 bg-surface-700 rounded-full h-1.5">
                              <div className={clsx('h-1.5 rounded-full', t.porcentaje_avance === 100 ? 'bg-emerald-500' : 'bg-brand-500')}
                                style={{ width: `${t.porcentaje_avance ?? 0}%` }} />
                            </div>
                            <span className="text-xs text-surface-400 w-8 text-right">{t.porcentaje_avance ?? 0}%</span>
                          </div>
                        </td>
                        <td className={clsx('text-xs', atrasada ? 'text-red-400' : 'text-surface-400')}>
                          {t.fecha_limite ? (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.fecha_limite}</span>
                          ) : '—'}
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openProgress(t)}
                              className="p-1.5 rounded-lg text-surface-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Actualizar progreso">
                              <TrendingUp className="w-3.5 h-3.5" />
                            </button>
                            {isAdmin && <>
                              <button onClick={() => { setEditing({ ...t }); setModal('edit') }}
                                className="p-1.5 rounded-lg text-surface-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => remove(t.id)}
                                className="p-1.5 rounded-lg text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="card w-full max-w-xl p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-white">{modal === 'create' ? 'Nueva tarea' : 'Editar tarea'}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-full">
                <label className="block text-xs font-medium text-surface-400 mb-1">Título *</label>
                <input value={editing.titulo || ''} onChange={e => setEditing({ ...editing, titulo: e.target.value })} className="input text-sm" placeholder="Título de la tarea" />
              </div>
              <div className="col-span-full">
                <label className="block text-xs font-medium text-surface-400 mb-1">Proyecto *</label>
                <select value={editing.proyecto_id || ''} onChange={e => setEditing({ ...editing, proyecto_id: +e.target.value })} className="input text-sm">
                  <option value="">Seleccionar proyecto...</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="col-span-full">
                <label className="block text-xs font-medium text-surface-400 mb-1">Responsable</label>
                <select value={editing.responsable_id || ''} onChange={e => setEditing({ ...editing, responsable_id: e.target.value })} className="input text-sm">
                  <option value="">Sin asignar</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
              </div>
              <div className="col-span-full">
                <label className="block text-xs font-medium text-surface-400 mb-1">Descripción</label>
                <textarea value={editing.descripcion || ''} onChange={e => setEditing({ ...editing, descripcion: e.target.value })} className="input text-sm resize-none h-16" placeholder="Descripción..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Prioridad</label>
                <select value={editing.prioridad_id || ''} onChange={e => setEditing({ ...editing, prioridad_id: +e.target.value })} className="input text-sm">
                  {prioridades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Estado</label>
                <select value={editing.estado_id || ''} onChange={e => setEditing({ ...editing, estado_id: +e.target.value })} className="input text-sm">
                  {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Fecha inicio</label>
                <input type="date" value={editing.fecha_inicio || ''} onChange={e => setEditing({ ...editing, fecha_inicio: e.target.value })} className="input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Fecha límite</label>
                <input type="date" value={editing.fecha_limite || ''} onChange={e => setEditing({ ...editing, fecha_limite: e.target.value })} className="input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Horas estimadas</label>
                <input type="number" min="0" value={editing.horas_estimadas || ''} onChange={e => setEditing({ ...editing, horas_estimadas: +e.target.value })} className="input text-sm" placeholder="0" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {modal === 'create' ? 'Crear tarea' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Progreso — admin Y empleado */}
      {modal === 'progress' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="card w-full max-w-sm p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-semibold text-white">Actualizar progreso</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-surface-300 mb-5 font-medium truncate">{editing.titulo}</p>
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-surface-400 mb-2">
                  <span>Porcentaje de avance</span>
                  <span className="text-brand-400 font-bold text-sm">{editing.porcentaje_avance}%</span>
                </label>
                <input type="range" min="0" max="100" value={editing.porcentaje_avance}
                  onChange={e => setEditing({ ...editing, porcentaje_avance: +e.target.value })}
                  className="w-full accent-brand-500 cursor-pointer" />
                <div className="mt-2 bg-surface-700 rounded-full h-2.5">
                  <div className={clsx('h-2.5 rounded-full transition-all duration-300', editing.porcentaje_avance === 100 ? 'bg-emerald-500' : 'bg-brand-500')}
                    style={{ width: `${editing.porcentaje_avance}%` }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Estado actual</label>
                <select value={editing.estado_id || ''} onChange={e => setEditing({ ...editing, estado_id: +e.target.value })} className="input text-sm">
                  {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Horas reales trabajadas</label>
                <input type="number" min="0" step="0.5" value={editing.horas_reales || ''} onChange={e => setEditing({ ...editing, horas_reales: +e.target.value })} className="input text-sm" placeholder="0" />
              </div>
              {editing.porcentaje_avance === 100 && (
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1">Fecha de finalización</label>
                  <input type="date" value={editing.fecha_finalizacion || ''} onChange={e => setEditing({ ...editing, fecha_finalizacion: e.target.value })} className="input text-sm" />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={saveProgress} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar progreso
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
