{/*
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Products from './pages/Products'
import Sales from './pages/Sales'
import Purchases from './pages/Purchases'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Logs from './pages/Logs'
import PrintReceipt from './pages/PrintReceipt'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">載入中...</div>
  return user ? children : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="products" element={<Products />} />
            <Route path="sales" element={<Sales />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
            <Route path="logs" element={<Logs />} />
          </Route>
          <Route path="/print/:id" element={<PrintReceipt />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App*/}
import { useEffect } from 'react' // 👈 1. 引入 useEffect
import { Command } from '@tauri-apps/api/shell' // 👈 2. 引入 Tauri 指令工具
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Products from './pages/Products'
import Sales from './pages/Sales'
import Purchases from './pages/Purchases'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Logs from './pages/Logs'
import PrintReceipt from './pages/PrintReceipt'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">載入中...</div>
  return user ? children : <Navigate to="/login" />
}

function App() {
  // 👈 3. 新增這段 useEffect 邏輯，讓 App 啟動時自動跑後端
  useEffect(() => {
    const startBackend = async () => {
      try {
        // 'binaries/server' 對應我們在 GitHub Actions 裡打包的後端程式
        const command = Command.sidecar('binaries/server')
        
        // 在背景將後端 .exe 跑起來
        const child = await command.spawn()
        console.log('後端服務已在背景啟動，PID:', child.pid)
        
        // 可選：在瀏覽器 Console 監聽後端輸出（除錯用）
        command.stdout.on('data', data => console.log(`後端輸出: ${data}`))
        command.stderr.on('data', data => console.error(`後端錯誤: ${data}`))
        
      } catch (error) {
        console.error('無法啟動後端服務:', error)
      }
    }

    startBackend()
  }, []) // 空陣列確保只在軟體打開時執行一次

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="products" element={<Products />} />
            <Route path="sales" element={<Sales />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
            <Route path="logs" element={<Logs />} />
          </Route>
          <Route path="/print/:id" element={<PrintReceipt />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App