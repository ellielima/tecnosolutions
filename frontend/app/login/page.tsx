'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowLeft, KeyRound } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  correo: z.string().email('Correo inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})
const forgotSchema = z.object({ correo: z.string().email('Correo inválido') })
const resetSchema = z.object({
  codigo: z.string().min(6, 'El código tiene 6 dígitos'),
  nueva_password: z.string().min(8, 'Mínimo 8 caracteres'),
})

type Mode = 'login' | 'forgot' | 'reset'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const loginForm  = useForm({ resolver: zodResolver(loginSchema) })
  const forgotForm = useForm({ resolver: zodResolver(forgotSchema) })
  const resetForm  = useForm({ resolver: zodResolver(resetSchema) })

  const onLogin = async (data: any) => {
    setLoading(true)
    try {
      await login(data.correo, data.password)
      toast.success('¡Bienvenido!')
      router.push('/dashboard')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  const onForgot = async (data: any) => {
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password', data)
      toast.success('Si el correo existe, recibirás un código')
      setMode('reset')
    } catch {
      toast.error('Error al procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  const onReset = async (data: any) => {
    setLoading(true)
    try {
      await api.post('/api/auth/reset-password', data)
      toast.success('Contraseña actualizada. Inicia sesión.')
      setMode('login')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Código inválido o expirado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-brand-700/10 blur-[100px]" />
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative w-full max-w-md px-4 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/30 mb-4">
            <KeyRound className="w-7 h-7 text-brand-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">TecnoSolutions</h1>
          <p className="text-surface-400 text-sm mt-1">Sistema de Gestión Empresarial</p>
        </div>

        <div className="card p-8 shadow-2xl shadow-black/40">

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <>
              <h2 className="font-display text-xl font-semibold text-white mb-6">Iniciar sesión</h2>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1.5">Correo electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                    <input {...loginForm.register('correo')} className="input pl-10"
                           placeholder="admin@tecnosolutions.com" />
                  </div>
                  {loginForm.formState.errors.correo && (
                    <p className="text-red-400 text-xs mt-1">{String(loginForm.formState.errors.correo.message)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1.5">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                    <input {...loginForm.register('password')} type={showPwd ? 'text' : 'password'}
                           className="input pl-10 pr-10" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-red-400 text-xs mt-1">{String(loginForm.formState.errors.password.message)}</p>
                  )}
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                  {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           : <LogIn className="w-4 h-4" />}
                  Ingresar
                </button>
              </form>

              {/*button onClick={() => setMode('forgot')}
                      className="w-full text-center text-sm text-brand-400 hover:text-brand-300 mt-4 transition-colors">
                ¿Olvidaste tu contraseña?
              </button*/}
            </>
          )}

          {/* ── FORGOT ── */}
          {mode === 'forgot' && (
            <>
              <button onClick={() => setMode('login')} className="flex items-center gap-1 text-surface-400 hover:text-surface-200 text-sm mb-5 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
              <h2 className="font-display text-xl font-semibold text-white mb-2">Recuperar contraseña</h2>
              <p className="text-surface-400 text-sm mb-6">Ingresa tu correo y te enviaremos un código de verificación.</p>
              <form onSubmit={forgotForm.handleSubmit(onForgot)} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1.5">Correo electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                    <input {...forgotForm.register('correo')} className="input pl-10" placeholder="tu@correo.com" />
                  </div>
                  {forgotForm.formState.errors.correo && (
                    <p className="text-red-400 text-xs mt-1">{String(forgotForm.formState.errors.correo.message)}</p>
                  )}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Enviar código
                </button>
              </form>
              <button onClick={() => setMode('reset')} className="w-full text-center text-sm text-surface-400 hover:text-surface-200 mt-3 transition-colors">
                Ya tengo un código
              </button>
            </>
          )}

          {/* ── RESET ── */}
          {mode === 'reset' && (
            <>
              <button onClick={() => setMode('forgot')} className="flex items-center gap-1 text-surface-400 hover:text-surface-200 text-sm mb-5 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
              <h2 className="font-display text-xl font-semibold text-white mb-2">Nueva contraseña</h2>
              <p className="text-surface-400 text-sm mb-6">Ingresa el código de 6 dígitos que te enviamos.</p>
              <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1.5">Código de verificación</label>
                  <input {...resetForm.register('codigo')} className="input text-center text-2xl tracking-[0.5em] font-bold"
                         placeholder="000000" maxLength={6} />
                  {resetForm.formState.errors.codigo && (
                    <p className="text-red-400 text-xs mt-1">{String(resetForm.formState.errors.codigo.message)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-400 mb-1.5">Nueva contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                    <input {...resetForm.register('nueva_password')} type={showPwd ? 'text' : 'password'}
                           className="input pl-10 pr-10" placeholder="Mínimo 8 caracteres" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {resetForm.formState.errors.nueva_password && (
                    <p className="text-red-400 text-xs mt-1">{String(resetForm.formState.errors.nueva_password.message)}</p>
                  )}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Cambiar contraseña
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
