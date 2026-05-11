'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Search, Loader2, X, FileDown, Calendar, DollarSign } from 'lucide-react'
import clsx from 'clsx'

type Proyecto = {
  id: number; nombre: string; descripcion: string; fecha_inicio: string; fecha_fin: string;
  presupuesto: number; estado_id: number; cliente_id: number;
  clientes?: { nombre: string; empresa: string }
  estados_proyecto?: { nombre: string }
}

const EMPTY: Partial<Proyecto> = { nombre:'', descripcion:'', fecha_inicio:'', fecha_fin:'', presupuesto: 0, cliente_id: 0, estado_id: 1 }

const estadoColor: Record<string, string> = {
  'Pendiente':   'bg-surface-700 text-surface-400',
  'En progreso': 'bg-brand-500/15 text-brand-400',
  'Finalizado':  'bg-emerald-500/15 text-emerald-400',
  'Cancelado':   'bg-red-500/15 text-red-400',
}

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [estados, setEstados] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<null | 'create' | 'edit'>(null)
  const [editing, setEditing] = useState<Partial<Proyecto>>(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [p, e, c] = await Promise.all([
      api.get('/api/proyectos/'),
      api.get('/api/proyectos/estados/lista'),
      api.get('/api/clientes/'),
    ])
    setProyectos(p.data); setEstados(e.data); setClientes(c.data); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = proyectos.filter(p =>
    p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    p.clientes?.nombre?.toLowerCase().includes(search.toLowerCase())
  )

  const save = async () => {
    if (!editing.nombre || !editing.cliente_id) return toast.error('Nombre y cliente son requeridos')
    setSaving(true)
    try {
      if (modal === 'create') { await api.post('/api/proyectos/', editing); toast.success('Proyecto creado') }
      else { await api.put(`/api/proyectos/${editing.id}`, editing); toast.success('Proyecto actualizado') }
      setModal(null); load()
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Error') }
    finally { setSaving(false) }
  }

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar proyecto y todas sus tareas?')) return
    try { await api.delete(`/api/proyectos/${id}`); toast.success('Eliminado'); load() }
    catch { toast.error('Error al eliminar') }
  }

  const downloadPDF = async (id: number, nombre: string) => {
    try {
      const res = await api.get(`/api/reportes/proyecto/${id}`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url
      a.download = `proyecto_${nombre.replace(/\s+/g,'_')}.pdf`; a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF descargado')
    } catch { toast.error('Error al generar PDF') }
  }

  return (
    <AppLayout>
      <div className="space-y-5 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-white">Proyectos</h1>
            <p className="text-surface-400 text-sm mt-0.5">{proyectos.length} proyectos registrados</p>
          </div>
          <button onClick={() => { setEditing(EMPTY); setModal('create') }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Nuevo proyecto
          </button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 text-sm" placeholder="Buscar..." />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(p => (
              <div key={p.id} className="card p-5 flex flex-col gap-3 hover:border-surface-600 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-surface-100 truncate">{p.nombre}</h3>
                    <p className="text-xs text-surface-400 mt-0.5 truncate">{p.clientes?.nombre} · {p.clientes?.empresa}</p>
                  </div>
                  <span className={clsx('badge flex-shrink-0', estadoColor[p.estados_proyecto?.nombre||''] || 'bg-surface-700 text-surface-400')}>
                    {p.estados_proyecto?.nombre || '—'}
                  </span>
                </div>

                {p.descripcion && <p className="text-xs text-surface-500 line-clamp-2">{p.descripcion}</p>}

                <div className="flex items-center gap-4 text-xs text-surface-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{p.fecha_inicio}</span>
                  {p.fecha_fin && <span>→ {p.fecha_fin}</span>}
                  {p.presupuesto > 0 && <span className="flex items-center gap-1 ml-auto"><DollarSign className="w-3 h-3" />{p.presupuesto.toLocaleString()}</span>}
                </div>

                <div className="flex items-center gap-1 pt-1 border-t border-surface-700">
                  <button onClick={() => { setEditing(p); setModal('edit') }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs text-surface-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors">
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                  <button onClick={() => downloadPDF(p.id, p.nombre)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs text-surface-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                    <FileDown className="w-3 h-3" /> PDF
                  </button>
                  <button onClick={() => remove(p.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3 h-3" /> Eliminar
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-surface-500">No se encontraron proyectos.</div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="card w-full max-w-lg p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-white">{modal === 'create' ? 'Nuevo proyecto' : 'Editar proyecto'}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-surface-400 mb-1">Nombre *</label>
                <input value={editing.nombre||''} onChange={e => setEditing({...editing, nombre: e.target.value})} className="input text-sm" placeholder="Nombre del proyecto" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-surface-400 mb-1">Cliente *</label>
                <select value={editing.cliente_id||''} onChange={e => setEditing({...editing, cliente_id: +e.target.value})} className="input text-sm">
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.empresa}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-surface-400 mb-1">Descripción</label>
                <textarea value={editing.descripcion||''} onChange={e => setEditing({...editing, descripcion: e.target.value})}
                  className="input text-sm resize-none h-20" placeholder="Descripción del proyecto" />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Fecha inicio *</label>
                <input type="date" value={editing.fecha_inicio||''} onChange={e => setEditing({...editing, fecha_inicio: e.target.value})} className="input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Fecha fin</label>
                <input type="date" value={editing.fecha_fin||''} onChange={e => setEditing({...editing, fecha_fin: e.target.value})} className="input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Presupuesto</label>
                <input type="number" value={editing.presupuesto||''} onChange={e => setEditing({...editing, presupuesto: +e.target.value})} className="input text-sm" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Estado</label>
                <select value={editing.estado_id||''} onChange={e => setEditing({...editing, estado_id: +e.target.value})} className="input text-sm">
                  {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {modal === 'create' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
