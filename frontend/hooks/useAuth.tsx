'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import Cookies from 'js-cookie'
import api from '@/lib/api'

interface User {
  id: string
  nombre: string
  correo: string
  rol: 'Administrador' | 'Empleado'
  activo: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (correo: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('access_token')
    if (token) {
      api.get('/api/usuarios/me')
        .then(({ data }) => {
          setUser({
            id: data.id,
            nombre: data.nombre,
            correo: data.correo,
            rol: data.roles?.nombre || 'Empleado',
            activo: data.activo,
          })
        })
        .catch(() => {
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (correo: string, password: string) => {
    const { data } = await api.post('/api/auth/login', { correo, password })
    Cookies.set('access_token', data.access_token, { expires: 1, secure: true, sameSite: 'strict' })
    Cookies.set('refresh_token', data.refresh_token, { expires: 7, secure: true, sameSite: 'strict' })
    setUser(data.user)
  }

  const logout = () => {
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.rol === 'Administrador' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
