'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Search, Loader2, X, UserCircle2 } from 'lucide-react'
import clsx from 'clsx'

type Cliente = {
  id: number; nombre: string; correo: string; telefono: string;
  empresa: string; estado_id: number; estados_cliente?: { nombre: string }
}

const EMPTY: Partial<Cliente> = { nombre:'', correo:'', telefono:'', empresa:'', estado_id: 1 }

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [estados, setEstados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<null | 'create' | 'edit'>(null)
  const [editing, setEditing] = useState<Partial<Cliente>>(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [c, e] = await Promise.all([api.get('/api/clientes/'), api.get('/api/clientes/estados/lista')])
    setClientes(c.data); setEstados(e.data); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.empresa?.toLowerCase().includes(search.toLowerCase()) ||
    c.correo?.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setEditing(EMPTY); setModal('create') }
  const openEdit   = (c: Cliente) => { setEditing(c); setModal('edit') }

  const save = async () => {
    if (!editing.nombre) return toast.error('El nombre es requerido')
    setSaving(true)
    try {
      if (modal === 'create') {
        await api.post('/api/clientes/', editing)
        toast.success('Cliente creado')
      } else {
        await api.put(`/api/clientes/${editing.id}`, editing)
        toast.success('Cliente actualizado')
      }
      setModal(null)
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar este cliente?')) return
    try {
      await api.delete(`/api/clientes/${id}`)
      toast.success('Cliente eliminado')
      load()
    } catch { toast.error('Error al eliminar') }
  }

  const estadoColor: Record<string, string> = {
    'Activo':    'bg-emerald-500/15 text-emerald-400',
    'Inactivo':  'bg-surface-700 text-surface-400',
    'Prospecto': 'bg-brand-500/15 text-brand-400',
    'Suspendido':'bg-red-500/15 text-red-400',
  }

  return (
    <AppLayout>
      <div className="space-y-5 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-white">Clientes</h1>
            <p className="text-surface-400 text-sm mt-0.5">{clientes.length} registros totales</p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Nuevo cliente
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-9 text-sm" placeholder="Buscar por nombre, empresa..." />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Cliente</th><th>Empresa</th><th>Correo</th><th>Teléfono</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-surface-500">No se encontraron clientes</td></tr>
                ) : filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-400 text-xs font-bold">{c.nombre?.charAt(0)}</span>
                        </div>
                        <span className="font-medium">{c.nombre}</span>
                      </div>
                    </td>
                    <td className="text-surface-400">{c.empresa || '—'}</td>
                    <td className="text-surface-400">{c.correo || '—'}</td>
                    <td className="text-surface-400">{c.telefono || '—'}</td>
                    <td>
                      <span className={clsx('badge', estadoColor[c.estados_cliente?.nombre||''] || 'bg-surface-700 text-surface-400')}>
                        {c.estados_cliente?.nombre || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-surface-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="card w-full max-w-md p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-white">
                {modal === 'create' ? 'Nuevo cliente' : 'Editar cliente'}
              </h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { field: 'nombre', label: 'Nombre *', placeholder: 'Nombre completo' },
                { field: 'correo', label: 'Correo', placeholder: 'correo@empresa.com' },
                { field: 'telefono', label: 'Teléfono', placeholder: '555-1234' },
                { field: 'empresa', label: 'Empresa', placeholder: 'Nombre de la empresa' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-surface-400 mb-1">{label}</label>
                  <input value={(editing as any)[field] || ''} onChange={e => setEditing({ ...editing, [field]: e.target.value })}
                    className="input text-sm" placeholder={placeholder} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">Estado</label>
                <select value={editing.estado_id || ''} onChange={e => setEditing({ ...editing, estado_id: +e.target.value })}
                  className="input text-sm">
                  {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
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
