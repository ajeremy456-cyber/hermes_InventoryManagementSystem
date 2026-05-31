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
import Activate from './pages/Activate'

function PrivateRoute({ children }) {
  const { user, loading, licenseActivated } = useAuth()
  
  if (loading) return <div className="loading">載入中...</div>
  
  if (licenseActivated === false) {
    return <Navigate to="/activate" />
  }
  
  return user ? children : <Navigate to="/login" />
}

function LicenseRoute({ children }) {
  const { licenseActivated, loading, user } = useAuth()
  
  if (loading) {
    return <div className="loading">載入中...</div>
  }
  
  if (licenseActivated === false) {
    return children
  }
  
  if (user) {
    return <Navigate to="/" />
  }
  
  return <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/activate" element={
            <LicenseRoute>
              <Activate />
            </LicenseRoute>
          } />
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