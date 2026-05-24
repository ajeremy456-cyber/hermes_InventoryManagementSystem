import { useState, useEffect } from 'react'
import api from '../api'
import dayjs from 'dayjs'

export default function Reports() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })

  const loadReport = () => {
    setLoading(true)
    const params = {}
    if (dateRange.startDate) params.startDate = dateRange.startDate
    if (dateRange.endDate) params.endDate = dateRange.endDate
    api.getSalesReport(params).then(res => setReport(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { loadReport() }, [])

  if (loading) return <div className="loading">載入中...</div>

  return (
    <div>
      <div className="page-header">
        <h1>銷售報表</h1>
      </div>

      <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="form-group"><label>開始日期</label><input type="date" value={dateRange.startDate} onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })} /></div>
        <div className="form-group"><label>結束日期</label><input type="date" value={dateRange.endDate} onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })} /></div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}><button className="btn btn-primary" onClick={loadReport}>查詢</button></div>
      </div>

      {report && (
        <>
          <div className="stats-grid">
            <div className="stat-card"><h3>總訂單數</h3><div className="value">{report.summary.total_orders}</div></div>
            <div className="stat-card"><h3>總營收</h3><div className="value">${report.summary.total_revenue.toLocaleString()}</div></div>
            <div className="stat-card"><h3>總折扣</h3><div className="value">${report.summary.total_discount.toLocaleString()}</div></div>
            <div className="stat-card"><h3>淨營收</h3><div className="value" style={{ color: '#28a745' }}>${report.summary.net_revenue.toLocaleString()}</div></div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">付款方式分布</span></div>
            <div className="table-container">
              <table>
                <thead><tr><th>付款方式</th><th>訂單數</th><th>金額</th></tr></thead>
                <tbody>
                  {report.byPayment.map(p => (
                    <tr key={p.payment_method}><td>{p.payment_method}</td><td>{p.count}</td><td>${p.amount.toLocaleString()}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">暢銷產品 TOP 10</span></div>
            <div className="table-container">
              {report.topProducts.length > 0 ? (
                <table>
                  <thead><tr><th>#</th><th>產品名稱</th><th>SKU</th><th>銷售數量</th><th>銷售金額</th></tr></thead>
                  <tbody>
                    {report.topProducts.map((p, i) => (
                      <tr key={i}><td>{i + 1}</td><td>{p.name}</td><td>{p.sku || '-'}</td><td>{p.total_qty}</td><td>${p.total_amount.toLocaleString()}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : <div className="empty-state">無資料</div>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}