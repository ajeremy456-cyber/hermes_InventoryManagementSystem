import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [licenseActivated, setLicenseActivated] = useState(null) // null = 檢查中, true = 已激活, false = 未激活

  useEffect(() => {
    checkLicenseStatus()
  }, [])

  const checkLicenseStatus = async () => {
    try {
      const res = await api.checkLicenseStatus()
      setLicenseActivated(res.data.activated)
      
      // 如果已激活，檢查用戶登入狀態（快速檢查，不等待 API）
      if (res.data.activated) {
        const token = sessionStorage.getItem('token')
        const storedUser = sessionStorage.getItem('user')
        if (token && storedUser) {
          setUser(JSON.parse(storedUser))
          // 不再调用 api.getMe()，直接使用本地数据
        }
      }
    } catch (error) {
      console.error('檢查授權狀態失敗:', error)
      // 如果檢查失敗，預設為未激活
      setLicenseActivated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLicenseActivated = () => {
    setLicenseActivated(true)
  }

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
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      licenseActivated,
      checkLicenseStatus,
      handleLicenseActivated
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)