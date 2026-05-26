import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import dayjs from 'dayjs'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentSales, setRecentSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getDashboardStats(),
      api.getRecentSales()
    ]).then(([statsRes, salesRes]) => {
      setStats(statsRes.data)
      setRecentSales(salesRes.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">載入中...</div>

  return (
    <div>
      <div className="page-header">
        <h1>儀表板</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>總客戶數</h3>
          <div className="value">{stats?.totalCustomers || 0}</div>
        </div>
        <div className="stat-card">
          <h3>總產品數</h3>
          <div className="value">{stats?.totalProducts || 0}</div>
        </div>
        <div className="stat-card">
          <h3>低庫存產品</h3>
          <div className="value" style={{ color: stats?.lowStockProducts > 0 ? '#dc3545' : '#28a745' }}>
            {stats?.lowStockProducts || 0}
          </div>
        </div>
        <div className="stat-card" >
          <h3>本月營收</h3>
          <div className="value" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            ${(stats?.monthlyRevenue || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.5rem' }}>
            銷售 {stats?.monthlySalesCount || 0} 筆
          </div>
        </div>
        

        
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">最近銷售</span>
          <Link to="/sales" className="btn btn-primary btn-sm">查看全部</Link>
        </div>
        <div className="table-container">
          {recentSales.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>客戶</th>
                  <th>金額</th>
                  <th>付款方式</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map(sale => (
                  <tr key={sale.id}>
                    <td>{dayjs(sale.created_at).format('YYYY-MM-DD HH:mm')}</td>
                    <td>{sale.customer_name || '散客'}</td>
                    <td>${sale.final_amount.toLocaleString()}</td>
                    <td><span className={`badge ${sale.payment_method === 'cash' ? 'badge-success' : 'badge-info'}`}>{sale.payment_method}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">尚無銷售記錄</div>
          )}
        </div>
      </div>
    </div>
  )
}