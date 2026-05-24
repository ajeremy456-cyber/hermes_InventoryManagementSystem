import { useState, useEffect } from 'react'
import api from '../api'

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ entityType: '', userId: '', limit: 100 })

  const loadLogs = () => {
    setLoading(true)
    const params = {}
    if (filters.entityType) params.entityType = filters.entityType
    if (filters.userId) params.userId = filters.userId
    if (filters.limit) params.limit = filters.limit
    api.getLogs(params).then(res => setLogs(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { loadLogs() }, [filters])

  return (
    <div>
      <div className="page-header">
        <h1>操作紀錄</h1>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <select value={filters.entityType} onChange={e => setFilters({ ...filters, entityType: e.target.value })}>
            <option value="">所有類型</option>
            <option value="customer">客戶</option>
            <option value="product">產品</option>
            <option value="sale">銷售</option>
            <option value="purchase">進貨</option>
            <option value="user">使用者</option>
          </select>
          <select value={filters.limit} onChange={e => setFilters({ ...filters, limit: e.target.value })}>
            <option value="50">最近 50 筆</option>
            <option value="100">最近 100 筆</option>
            <option value="500">最近 500 筆</option>
          </select>
        </div>

        <div className="table-container">
          {logs.length > 0 ? (
            <table>
              <thead><tr><th>時間</th><th>使用者</th><th>動作</th><th>類型</th><th>IP</th></tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                    <td>{log.user_name || '-'}</td>
                    <td>{log.action}</td>
                    <td><span className="badge badge-info">{log.entity_type || '-'}</span></td>
                    <td>{log.ip_address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty-state">尚無操作紀錄</div>}
        </div>
      </div>
    </div>
  )
}