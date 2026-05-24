import { useState, useEffect } from 'react'
import api from '../api'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' })
  const [error, setError] = useState('')

  const loadCustomers = () => {
    api.getCustomers().then(res => setCustomers(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { loadCustomers() }, [])

  const openCreate = () => { setEditData(null); setForm({ name: '', phone: '', email: '', address: '' }); setError(''); setShowModal(true) }
  const openEdit = (c) => { setEditData(c); setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '' }); setError(''); setShowModal(true) }

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
        <button className="btn btn-primary" onClick={openCreate}>新增客戶</button>
      </div>

      <div className="card">
        <div className="table-container">
          {customers.length > 0 ? (
            <table>
              <thead><tr><th>名稱</th><th>電話</th><th>Email</th><th>地址</th><th>操作</th></tr></thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.phone || '-'}</td>
                    <td>{c.email || '-'}</td>
                    <td>{c.address || '-'}</td>
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
              <div className="form-group"><label>電話</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="form-group"><label>地址</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">儲存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}