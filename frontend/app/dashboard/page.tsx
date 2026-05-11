'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell as RCell
} from 'recharts'
import {
  Users, FolderKanban, CheckSquare, TrendingUp,
  Clock, AlertTriangle, CheckCircle2, Loader2
} from 'lucide-react'
import clsx from 'clsx'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function StatCard({ icon: Icon, label, value, color, sub }: any) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-surface-400 text-xs font-medium mb-0.5">{label}</p>
        <p className="text-2xl font-bold font-display text-white">{value}</p>
        {sub && <p className="text-surface-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function EstadoBadge({ nombre }: { nombre?: string }) {
  const map: Record<string, string> = {
    'Pendiente':   'bg-surface-700 text-surface-300',
    'En progreso': 'bg-brand-500/15 text-brand-400',
    'Completada':  'bg-emerald-500/15 text-emerald-400',
    'Finalizado':  'bg-emerald-500/15 text-emerald-400',
    'Atrasada':    'bg-red-500/15 text-red-400',
    'Cancelado':   'bg-red-500/15 text-red-400',
  }
  return (
    <span className={clsx('badge', map[nombre || ''] || 'bg-surface-700 text-surface-300')}>
      {nombre || '—'}
    </span>
  )
}

function PrioridadBadge({ nombre }: { nombre?: string }) {
  const map: Record<string, string> = {
    'Baja':    'bg-slate-500/15 text-slate-400',
    'Media':   'bg-yellow-500/15 text-yellow-400',
    'Alta':    'bg-orange-500/15 text-orange-400',
    'Urgente': 'bg-red-500/15 text-red-400',
  }
  return (
    <span className={clsx('badge', map[nombre || ''] || 'bg-surface-700 text-surface-300')}>
      {nombre || '—'}
    </span>
  )
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [misTareas, setMisTareas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAdmin) {
          const [proyStats, clientes, tareas, usuarios] = await Promise.all([
            api.get('/api/proyectos/stats/dashboard'),
            api.get('/api/clientes/'),
            api.get('/api/tareas/'),
            api.get('/api/usuarios/'),
          ])
          setStats({
            proyectos: proyStats.data,
            totalClientes: clientes.data.length,
            totalTareas: tareas.data.length,
            totalUsuarios: usuarios.data.length,
            tareas: tareas.data,
          })
        } else {
          const { data } = await api.get('/api/tareas/mis-tareas')
          setMisTareas(data)
        }
      } catch {
        // silencioso, loading termina igual
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isAdmin])

  // Datos para gráficas con fallback seguro
  const pieDataProyectos = Object.entries(
    stats?.proyectos?.proyectos_por_estado ?? {}
  ).map(([name, value]) => ({ name, value }))

  const barDataTareas = Object.entries(
    stats?.proyectos?.tareas_por_estado ?? {}
  ).map(([name, value]) => ({ name, value }))

  const atrasadas  = misTareas.filter(t => t._atrasada || t.estados_tarea?.nombre === 'Atrasada')
  const completadas = misTareas.filter(t => t.estados_tarea?.nombre === 'Completada')
  const pendientes  = misTareas.filter(t => ['Pendiente', 'En progreso'].includes(t.estados_tarea?.nombre))

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Bienvenido, {user?.nombre?.split(' ')[0]} 👋
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            {new Date().toLocaleDateString('es-GT', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          </div>
        ) : isAdmin ? (
          <>
            {/* KPIs Admin */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={FolderKanban} label="Proyectos" color="bg-brand-500"
                value={stats?.proyectos?.total_proyectos ?? 0}
                sub="Total registrados"
              />
              <StatCard
                icon={CheckSquare} label="Tareas" color="bg-emerald-500"
                value={stats?.proyectos?.total_tareas ?? 0}
                sub="Total registradas"
              />
              <StatCard
                icon={Users} label="Clientes" color="bg-amber-500"
                value={stats?.totalClientes ?? 0}
                sub="Registrados"
              />
              <StatCard
                icon={TrendingUp} label="Usuarios" color="bg-violet-500"
                value={stats?.totalUsuarios ?? 0}
                sub="En el sistema"
              />
            </div>

            {/* Gráficas */}
            <div className="grid lg:grid-cols-2 gap-5">
              <div className="card p-6">
                <h2 className="font-display font-semibold text-white mb-4 text-sm">
                  Proyectos por estado
                </h2>
                {pieDataProyectos.length === 0 ? (
                  <p className="text-surface-500 text-sm text-center py-10">Sin datos aún</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieDataProyectos}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={85}
                        paddingAngle={4} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieDataProyectos.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#1e293b', border: '1px solid #334155',
                          borderRadius: 8, fontSize: 12
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="card p-6">
                <h2 className="font-display font-semibold text-white mb-4 text-sm">
                  Tareas por estado
                </h2>
                {barDataTareas.length === 0 ? (
                  <p className="text-surface-500 text-sm text-center py-10">Sin datos aún</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barDataTareas} barSize={28}>
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: '#1e293b', border: '1px solid #334155',
                          borderRadius: 8, fontSize: 12
                        }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {barDataTareas.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Tabla de tareas recientes */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-white mb-4 text-sm">Tareas recientes</h2>
              {(stats?.tareas ?? []).length === 0 ? (
                <p className="text-surface-500 text-sm text-center py-8">No hay tareas registradas.</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Tarea</th>
                        <th>Proyecto</th>
                        <th>Responsable</th>
                        <th>Estado</th>
                        <th>Avance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stats?.tareas ?? []).slice(0, 8).map((t: any) => (
                        <tr key={t.id}>
                          <td className="font-medium">{t.titulo}</td>
                          <td className="text-surface-400">{t.proyectos?.nombre || '—'}</td>
                          <td className="text-surface-400">{t.usuarios?.nombre || '—'}</td>
                          <td><EstadoBadge nombre={t.estados_tarea?.nombre} /></td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-surface-700 rounded-full h-1.5 w-16">
                                <div
                                  className="bg-brand-500 h-1.5 rounded-full"
                                  style={{ width: `${t.porcentaje_avance ?? 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-surface-400">
                                {t.porcentaje_avance ?? 0}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          /* ── Vista Empleado ── */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard icon={Clock}         label="Pendientes"  value={pendientes.length}  color="bg-amber-500" />
              <StatCard icon={CheckCircle2}  label="Completadas" value={completadas.length} color="bg-emerald-500" />
              <StatCard icon={AlertTriangle} label="Atrasadas"   value={atrasadas.length}   color="bg-red-500" />
            </div>

            <div className="card p-6">
              <h2 className="font-display font-semibold text-white mb-4">Mis tareas</h2>
              {misTareas.length === 0 ? (
                <p className="text-surface-400 text-sm text-center py-8">
                  No tienes tareas asignadas aún.
                </p>
              ) : (
                <div className="space-y-3">
                  {misTareas.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-surface-700/30 border border-surface-700 hover:border-surface-600 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-surface-100 truncate">{t.titulo}</p>
                        <p className="text-xs text-surface-400 mt-0.5">{t.proyectos?.nombre}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {t.fecha_limite && (
                          <span className={clsx(
                            'text-xs flex items-center gap-1',
                            new Date(t.fecha_limite) < new Date() ? 'text-red-400' : 'text-surface-400'
                          )}>
                            <Clock className="w-3 h-3" />
                            {t.fecha_limite}
                          </span>
                        )}
                        <EstadoBadge nombre={t.estados_tarea?.nombre} />
                        <PrioridadBadge nombre={t.prioridades_tarea?.nombre} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
