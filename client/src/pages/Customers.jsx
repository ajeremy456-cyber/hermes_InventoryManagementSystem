import { useState, useEffect } from 'react'
import api from '../api'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', license_plate: '', car_model: '', manufacture_date: '' })
  const [error, setError] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [inspectionList, setInspectionList] = useState([])

  const loadCustomers = () => {
    if (searchKeyword.trim()) {
      api.searchCustomers(searchKeyword).then(res => setCustomers(res.data)).finally(() => setLoading(false))
    } else {
      api.getCustomers().then(res => setCustomers(res.data)).finally(() => setLoading(false))
    }
  }

  useEffect(() => { loadCustomers() }, [searchKeyword])

  const openCreate = () => { setEditData(null); setForm({ name: '', phone: '', license_plate: '', car_model: '', manufacture_date: '' }); setError(''); setShowModal(true) }
  const openEdit = (c) => { setEditData(c); setForm({ name: c.name, phone: c.phone || '', license_plate: c.license_plate || '', car_model: c.car_model || '', manufacture_date: c.manufacture_date || '' }); setError(''); setShowModal(true) }

  const calculateInspection = () => {
    const now = new Date()
    const oneMonthLater = new Date(now)
    oneMonthLater.setMonth(now.getMonth() + 1)

    const list = []
    
    customers.forEach(customer => {
      if (!customer.manufacture_date) return

      const manufactureDate = new Date(customer.manufacture_date)
      const ageInYears = (now - manufactureDate) / (1000 * 60 * 60 * 24 * 365.25)

      if (ageInYears < 5) return

      let inspectionType
      let inspectionDates = []

      if (ageInYears >= 5 && ageInYears < 10) {
        inspectionType = '每年驗車'
        for (let year = 5; year <= 10; year++) {
          const date = new Date(manufactureDate)
          date.setFullYear(manufactureDate.getFullYear() + year)
          inspectionDates.push(date)
        }
      } else {
        inspectionType = '每半年驗車'
        const startDate = new Date(manufactureDate)
        startDate.setFullYear(manufactureDate.getFullYear() + 10)
        for (let i = 0; i <= (ageInYears - 10) * 2 + 2; i++) {
          const date = new Date(startDate)
          date.setMonth(startDate.getMonth() + i * 6)
          inspectionDates.push(date)
        }
      }

      for (const date of inspectionDates) {
        if (date <= oneMonthLater) {
          const isOverdue = date < now
          list.push({ 
            ...customer, 
            inspectionType, 
            isOverdue, 
            nextInspectionDate: date 
          })
          break
        }
      }
    })

    setInspectionList(list)
    setShowInspectionModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editData) {
        await api.updateCustomer(editData.id, form)
      } else {
        await api.createCustomer(form)
      }
      setShowModal(false)
      loadCustomers()
    } catch (err) {
      setError(err.response?.data?.error || '儲存失敗')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('確定要刪除嗎？')) return
    await api.deleteCustomer(id)
    loadCustomers()
  }

  if (loading) return <div className="loading">載入中...</div>

  return (
    <div>
      <div className="page-header">
        <h1>客戶管理</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={calculateInspection}>驗車提醒</button>
          <button className="btn btn-primary" onClick={openCreate}>新增客戶</button>
        </div>
      </div>

      <div className="search-bar">
        <input 
          type="text" 
          placeholder="輸入姓名或手機號碼搜尋..." 
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="table-container">
          {customers.length > 0 ? (
            <table>
              <thead><tr><th>姓名</th><th>手機號碼</th><th>車牌</th><th>車型</th><th>車輛出廠日期</th><th>上次到廠日期</th><th>操作</th></tr></thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.phone || '-'}</td>
                    <td>{c.license_plate || '-'}</td>
                    <td>{c.car_model || '-'}</td>
                    <td>{c.manufacture_date || '-'}</td>
                    <td>{c.last_visit_date ? new Date(c.last_visit_date).toLocaleDateString() : '-'}</td>
                    <td className="actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>編輯</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>刪除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty-state">尚無客戶資料</div>}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editData ? '編輯客戶' : '新增客戶'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>姓名 *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="form-group"><label>手機號碼</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="form-group"><label>車牌</label><input value={form.license_plate} onChange={e => setForm({ ...form, license_plate: e.target.value })} /></div>
              <div className="form-group"><label>車型</label><input value={form.car_model} onChange={e => setForm({ ...form, car_model: e.target.value })} /></div>
              <div className="form-group"><label>車輛出廠日期</label><input type="date" value={form.manufacture_date} onChange={e => setForm({ ...form, manufacture_date: e.target.value })} /></div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">儲存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInspectionModal && (
        <div className="modal-overlay" onClick={() => setShowInspectionModal(false)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>驗車提醒</h2>
              <button className="modal-close" onClick={() => setShowInspectionModal(false)}>×</button>
            </div>
            {inspectionList.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>客戶名稱</th>
                      <th>手機號碼</th>
                      <th>驗車日期</th>
                      <th>驗車類型</th>
                      <th>狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectionList.map(c => (
                      <tr key={c.id} style={{ background: c.isOverdue ? '#fff5f5' : 'white' }}>
                        <td>{c.name}</td>
                        <td>{c.phone || '-'}</td>
                        <td>{new Date(c.nextInspectionDate).toLocaleDateString()}</td>
                        <td><span className={`badge ${c.inspectionType === '每年驗車' ? 'badge-warning' : 'badge-danger'}`}>{c.inspectionType}</span></td>
                        <td><span className={`badge ${c.isOverdue ? 'badge-danger' : 'badge-info'}`}>{c.isOverdue ? '已逾期' : '即將到期'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">一個月內沒有需要驗車的客戶</div>
            )}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowInspectionModal(false)}>關閉</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}