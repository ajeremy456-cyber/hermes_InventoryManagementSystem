import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>📦 庫存系統</h2>
        <nav>
          <NavLink to="/" end><span>📊</span> 儀表板</NavLink>
          <NavLink to="/customers"><span>👥</span> 車輛管理</NavLink>
          <NavLink to="/products"><span>📦</span> 庫存管理</NavLink>
          <NavLink to="/sales"><span>💰</span> 銷售管理</NavLink>
          <NavLink to="/purchases"><span>🚚</span> 進貨管理</NavLink>
          <NavLink to="/reports"><span>📈</span> 銷售報表</NavLink>
          <NavLink to="/users"><span>👤</span> 使用者管理</NavLink>
          <NavLink to="/settings"><span>⚙️</span> 系統設定</NavLink>
          <NavLink to="/logs"><span>📝</span> 操作紀錄</NavLink>
        </nav>
      </aside>
      <div className="main-content">
        <div className="topbar">
          <span>歡迎，{user?.name || user?.username}</span>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>登出</button>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}