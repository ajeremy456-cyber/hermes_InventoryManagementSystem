import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = sessionStorage.getItem('token')
    const storedUser = sessionStorage.getItem('user')
    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
      api.getMe().then(res => {
        setUser(res.data)
        sessionStorage.setItem('user', JSON.stringify(res.data))
      }).catch(() => {
        logout()
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const res = await api.login({ username, password })
    sessionStorage.setItem('token', res.data.token)
    sessionStorage.setItem('user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data
  }

  const logout = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)