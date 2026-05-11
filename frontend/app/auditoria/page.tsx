'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import api from '@/lib/api'
import { Loader2, Shield, Database, User } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts'
import clsx from 'clsx'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const accionColor: Record<string, string> = {
  'INSERT': 'bg-emerald-500/15 text-emerald-400',
  'UPDATE': 'bg-brand-500/15 text-brand-400',
  'DELETE': 'bg-red-500/15 text-red-400',
  'LOGIN':  'bg-amber-500/15 text-amber-400',
}

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const PER_PAGE = 20

  useEffect(() => {
    const load = async () => {
      const [r, s] = await Promise.all([
        api.get(`/api/auditoria/?limit=200&offset=0`),
        api.get('/api/auditoria/stats'),
      ])
      setRegistros(r.data); setStats(s.data); setLoading(false)
    }
    load()
  }, [])

  const barAcciones = stats
    ? Object.entries(stats.por_accion).map(([name, value]) => ({ name, value }))
    : []
  const barTablas = stats
    ? Object.entries(stats.por_tabla).map(([name, value]) => ({ name, value }))
    : []

  const paginated = registros.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages = Math.ceil(registros.length / PER_PAGE)

  return (
    <AppLayout>
      <div className="space-y-5 animate-slide-up">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Auditoría</h1>
          <p className="text-surface-400 text-sm mt-0.5">Registro histórico de actividad del sistema</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total eventos', value: stats?.total || 0, icon: Shield, color: 'bg-brand-500' },
                { label: 'Inserciones', value: stats?.por_accion?.INSERT || 0, icon: Database, color: 'bg-emerald-500' },
                { label: 'Actualizaciones', value: stats?.por_accion?.UPDATE || 0, icon: Database, color: 'bg-amber-500' },
                { label: 'Eliminaciones', value: stats?.por_accion?.DELETE || 0, icon: Database, color: 'bg-red-500' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="card p-5 flex items-start gap-4">
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-surface-400 text-xs">{label}</p>
                    <p className="text-2xl font-bold font-display text-white">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-5">
              <div className="card p-6">
                <h2 className="font-display font-semibold text-white mb-4 text-sm">Eventos por acción</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={barAcciones} barSize={32}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {barAcciones.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card p-6">
                <h2 className="font-display font-semibold text-white mb-4 text-sm">Eventos por tabla</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={barTablas} barSize={24} layout="vertical">
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {barTablas.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Log table */}
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-700">
                <h2 className="font-display font-semibold text-white text-sm">Registro de actividad</h2>
              </div>
              <div className="table-wrapper rounded-none border-0">
                <table>
                  <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Tabla</th><th>Descripción</th><th>IP</th></tr></thead>
                  <tbody>
                    {paginated.map((r: any) => (
                      <tr key={r.id}>
                        <td className="text-xs text-surface-500 whitespace-nowrap">
                          {new Date(r.fecha).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-surface-700 flex items-center justify-center flex-shrink-0">
                              <User className="w-3 h-3 text-surface-400" />
                            </div>
                            <span className="text-xs">{r.usuarios?.nombre || 'Sistema'}</span>
                          </div>
                        </td>
                        <td>
                          <span className={clsx('badge text-xs', accionColor[r.accion] || 'bg-surface-700 text-surface-400')}>
                            {r.accion}
                          </span>
                        </td>
                        <td className="text-xs text-surface-400 font-mono">{r.tabla_afectada}</td>
                        <td className="text-xs text-surface-300 max-w-xs truncate">{r.descripcion}</td>
                        <td className="text-xs text-surface-500 font-mono">{r.ip_address || '—'}</td>
                      </tr>
                    ))}
                    {paginated.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-10 text-surface-500">Sin registros.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-surface-700">
                  <p className="text-xs text-surface-400">
                    Página {page + 1} de {totalPages} · {registros.length} registros
                  </p>
                  <div className="flex gap-2">
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                      className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Anterior</button>
                    <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                      className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Siguiente</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
