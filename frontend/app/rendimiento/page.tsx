'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import api from '@/lib/api'
import { Loader2, TrendingUp, CheckCircle2, Clock, AlertTriangle, User } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend
} from 'recharts'
import clsx from 'clsx'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

type EmpleadoStats = {
  id: string
  nombre: string
  correo: string
  total: number
  completadas: number
  en_progreso: number
  pendientes: number
  atrasadas: number
  promedio_avance: number
  horas_estimadas: number
  horas_reales: number
  eficiencia: number
}

export default function RendimientoPage() {
  const [empleados, setEmpleados] = useState<EmpleadoStats[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionado, setSeleccionado] = useState<EmpleadoStats | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [tareasRes, usuariosRes] = await Promise.all([
          api.get('/api/tareas/'),
          api.get('/api/usuarios/'),
        ])

        const tareas = tareasRes.data
        const usuarios = usuariosRes.data.filter((u: any) => u.roles?.nombre === 'Empleado')

        const stats: EmpleadoStats[] = usuarios.map((u: any) => {
          const tareasEmpleado = tareas.filter((t: any) => t.responsable_id === u.id)
          const completadas  = tareasEmpleado.filter((t: any) => t.estados_tarea?.nombre === 'Completada').length
          const en_progreso  = tareasEmpleado.filter((t: any) => t.estados_tarea?.nombre === 'En progreso').length
          const pendientes   = tareasEmpleado.filter((t: any) => t.estados_tarea?.nombre === 'Pendiente').length
          const atrasadas    = tareasEmpleado.filter((t: any) =>
            t.estados_tarea?.nombre === 'Atrasada' || t._atrasada
          ).length

          const promedio_avance = tareasEmpleado.length
            ? Math.round(tareasEmpleado.reduce((s: number, t: any) => s + (t.porcentaje_avance ?? 0), 0) / tareasEmpleado.length)
            : 0

          const horas_estimadas = tareasEmpleado.reduce((s: number, t: any) => s + (t.horas_estimadas ?? 0), 0)
          const horas_reales    = tareasEmpleado.reduce((s: number, t: any) => s + (t.horas_reales ?? 0), 0)

          // Eficiencia: 100% si horas_reales <= estimadas, baja si se pasa
          const eficiencia = horas_estimadas > 0 && horas_reales > 0
            ? Math.min(100, Math.round((horas_estimadas / horas_reales) * 100))
            : promedio_avance

          return {
            id: u.id,
            nombre: u.nombre,
            correo: u.correo,
            total: tareasEmpleado.length,
            completadas,
            en_progreso,
            pendientes,
            atrasadas,
            promedio_avance,
            horas_estimadas: Math.round(horas_estimadas * 10) / 10,
            horas_reales: Math.round(horas_reales * 10) / 10,
            eficiencia,
          }
        })

        setEmpleados(stats)
        if (stats.length > 0) setSeleccionado(stats[0])
      } catch {
        // silencioso
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Datos para gráfica de barras comparativa
  const barData = empleados.map(e => ({
    nombre: e.nombre.split(' ')[0], // solo primer nombre para que quepa
    Completadas: e.completadas,
    'En progreso': e.en_progreso,
    Pendientes: e.pendientes,
    Atrasadas: e.atrasadas,
  }))

  // Datos para gráfica de avance promedio
  const avanceData = empleados.map(e => ({
    nombre: e.nombre.split(' ')[0],
    Avance: e.promedio_avance,
    Eficiencia: e.eficiencia,
  }))

  // Datos radar para el empleado seleccionado
  const radarData = seleccionado ? [
    { metric: 'Completadas', value: seleccionado.total > 0 ? Math.round((seleccionado.completadas / seleccionado.total) * 100) : 0 },
    { metric: 'Avance %',    value: seleccionado.promedio_avance },
    { metric: 'Eficiencia',  value: seleccionado.eficiencia },
    { metric: 'Sin atrasos', value: seleccionado.total > 0 ? Math.round(((seleccionado.total - seleccionado.atrasadas) / seleccionado.total) * 100) : 100 },
    { metric: 'Activas',     value: seleccionado.total > 0 ? Math.round(((seleccionado.completadas + seleccionado.en_progreso) / seleccionado.total) * 100) : 0 },
  ] : []

  const nivelRendimiento = (e: EmpleadoStats) => {
    const score = (e.promedio_avance + e.eficiencia) / 2
    if (score >= 80) return { label: 'Excelente', color: 'bg-emerald-500/15 text-emerald-400' }
    if (score >= 60) return { label: 'Bueno',     color: 'bg-brand-500/15 text-brand-400' }
    if (score >= 40) return { label: 'Regular',   color: 'bg-amber-500/15 text-amber-400' }
    return { label: 'Bajo',  color: 'bg-red-500/15 text-red-400' }
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">

        {/* Header */}
        <div>
          <h1 className="font-display text-xl font-bold text-white">Rendimiento de Empleados</h1>
          <p className="text-surface-400 text-sm mt-0.5">Productividad y avance por empleado</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
          </div>
        ) : empleados.length === 0 ? (
          <div className="card p-12 text-center">
            <User className="w-12 h-12 text-surface-600 mx-auto mb-3" />
            <p className="text-surface-400">No hay empleados con tareas asignadas aún.</p>
          </div>
        ) : (
          <>
            {/* Tarjetas resumen por empleado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {empleados.map((e, i) => {
                const nivel = nivelRendimiento(e)
                const isSelected = seleccionado?.id === e.id
                return (
                  <button
                    key={e.id}
                    onClick={() => setSeleccionado(e)}
                    className={clsx(
                      'card p-5 text-left transition-all duration-200 hover:border-brand-500/40',
                      isSelected && 'border-brand-500/50 bg-brand-500/5'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: `${COLORS[i % COLORS.length]}25`, border: `1px solid ${COLORS[i % COLORS.length]}40` }}>
                          <span className="font-bold text-sm" style={{ color: COLORS[i % COLORS.length] }}>
                            {e.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-surface-100 truncate text-sm">{e.nombre}</p>
                          <p className="text-xs text-surface-500 truncate">{e.correo}</p>
                        </div>
                      </div>
                      <span className={clsx('badge text-xs flex-shrink-0', nivel.color)}>{nivel.label}</span>
                    </div>

                    {/* Barra de avance */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-surface-400 mb-1">
                        <span>Avance promedio</span>
                        <span className="font-semibold text-surface-200">{e.promedio_avance}%</span>
                      </div>
                      <div className="bg-surface-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${e.promedio_avance}%`, background: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>

                    {/* Stats mini */}
                    <div className="grid grid-cols-4 gap-1 text-center">
                      {[
                        { label: 'Total',    value: e.total,       color: 'text-surface-300' },
                        { label: 'Listas',   value: e.completadas, color: 'text-emerald-400' },
                        { label: 'Activas',  value: e.en_progreso, color: 'text-brand-400' },
                        { label: 'Atrasadas',value: e.atrasadas,   color: 'text-red-400' },
                      ].map(stat => (
                        <div key={stat.label} className="bg-surface-700/50 rounded-lg py-1.5">
                          <p className={clsx('text-sm font-bold', stat.color)}>{stat.value}</p>
                          <p className="text-surface-500 text-xs">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Horas */}
                    {(e.horas_estimadas > 0 || e.horas_reales > 0) && (
                      <div className="flex gap-3 mt-3 pt-3 border-t border-surface-700">
                        <div className="flex-1 text-center">
                          <p className="text-xs text-surface-500">Estimadas</p>
                          <p className="text-sm font-semibold text-surface-200">{e.horas_estimadas}h</p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-xs text-surface-500">Reales</p>
                          <p className={clsx('text-sm font-semibold', e.horas_reales > e.horas_estimadas && e.horas_estimadas > 0 ? 'text-amber-400' : 'text-surface-200')}>
                            {e.horas_reales}h
                          </p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-xs text-surface-500">Eficiencia</p>
                          <p className={clsx('text-sm font-semibold', e.eficiencia >= 80 ? 'text-emerald-400' : e.eficiencia >= 60 ? 'text-amber-400' : 'text-red-400')}>
                            {e.eficiencia}%
                          </p>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Gráficas comparativas */}
            <div className="grid lg:grid-cols-2 gap-5">

              {/* Tareas por estado por empleado */}
              <div className="card p-6">
                <h2 className="font-display font-semibold text-white mb-1 text-sm">Tareas por empleado</h2>
                <p className="text-surface-500 text-xs mb-4">Distribución de estados por persona</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} barSize={10}>
                    <XAxis dataKey="nombre" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                    <Bar dataKey="Completadas"  fill="#10b981" radius={[3,3,0,0]} />
                    <Bar dataKey="En progreso"  fill="#6366f1" radius={[3,3,0,0]} />
                    <Bar dataKey="Pendientes"   fill="#475569" radius={[3,3,0,0]} />
                    <Bar dataKey="Atrasadas"    fill="#ef4444" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Avance y eficiencia */}
              <div className="card p-6">
                <h2 className="font-display font-semibold text-white mb-1 text-sm">Avance y eficiencia</h2>
                <p className="text-surface-500 text-xs mb-4">Porcentaje promedio de avance vs eficiencia en horas</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={avanceData} barSize={16}>
                    <XAxis dataKey="nombre" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip
                      formatter={(value: any) => `${value}%`}
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                    <Bar dataKey="Avance"     fill="#6366f1" radius={[4,4,0,0]} />
                    <Bar dataKey="Eficiencia" fill="#10b981" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detalle del empleado seleccionado */}
            {seleccionado && (
              <div className="card p-6">
                <h2 className="font-display font-semibold text-white mb-1 text-sm">
                  Perfil de rendimiento — {seleccionado.nombre}
                </h2>
                <p className="text-surface-500 text-xs mb-5">Haz clic en una tarjeta de empleado para ver su detalle</p>

                <div className="grid lg:grid-cols-2 gap-6 items-center">
                  {/* Radar */}
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                      <Radar name={seleccionado.nombre.split(' ')[0]} dataKey="value"
                        stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                      <Tooltip
                        formatter={(v: any) => `${v}%`}
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>

                  {/* Stats detalle */}
                  <div className="space-y-3">
                    {[
                      { label: 'Total de tareas asignadas', value: `${seleccionado.total}`, icon: TrendingUp, color: 'text-brand-400' },
                      { label: 'Tareas completadas',        value: `${seleccionado.completadas} (${seleccionado.total > 0 ? Math.round((seleccionado.completadas/seleccionado.total)*100) : 0}%)`, icon: CheckCircle2, color: 'text-emerald-400' },
                      { label: 'Tareas atrasadas',          value: `${seleccionado.atrasadas}`, icon: AlertTriangle, color: seleccionado.atrasadas > 0 ? 'text-red-400' : 'text-surface-400' },
                      { label: 'Avance promedio',           value: `${seleccionado.promedio_avance}%`, icon: TrendingUp, color: 'text-brand-400' },
                      { label: 'Horas estimadas vs reales', value: `${seleccionado.horas_estimadas}h estimadas / ${seleccionado.horas_reales}h reales`, icon: Clock, color: 'text-amber-400' },
                      { label: 'Eficiencia en tiempo',      value: `${seleccionado.eficiencia}%`, icon: CheckCircle2, color: seleccionado.eficiencia >= 80 ? 'text-emerald-400' : seleccionado.eficiencia >= 60 ? 'text-amber-400' : 'text-red-400' },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-surface-700/30">
                        <Icon className={clsx('w-4 h-4 flex-shrink-0', color)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-surface-400">{label}</p>
                          <p className="text-sm font-semibold text-surface-100">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
