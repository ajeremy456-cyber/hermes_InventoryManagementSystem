import { useState, useEffect } from 'react'
import api from '../api'

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [form, setForm] = useState({ name: '', sku: '', category: '', price: '', cost: '', quantity: '', min_stock: '10', unit: '', description: '' })
  const [error, setError] = useState('')

  const loadProducts = () => {
    api.getProducts(filterLowStock ? { lowStock: 'true' } : {}).then(res => setProducts(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { loadProducts() }, [filterLowStock])
  useEffect(() => { api.getCategories().then(res => setCategories(res.data)).catch(() => {}) }, [])

  const openCreate = () => { setEditData(null); setForm({ name: '', sku: '', category: '', price: '', cost: '', quantity: '', min_stock: '10', unit: '', description: '' }); setError(''); setShowModal(true) }
  const openEdit = (p) => {
    setEditData(p)
    setForm({ name: p.name, sku: p.sku || '', category: p.category || '', price: p.price, cost: p.cost, quantity: p.quantity, min_stock: p.min_stock, unit: p.unit || '', description: p.description || '' })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { ...form, price: parseFloat(form.price), cost: parseFloat(form.cost) || 0, quantity: parseInt(form.quantity) || 0, min_stock: parseInt(form.min_stock) || 10 }
      if (editData) { await api.updateProduct(editData.id, data) } else { await api.createProduct(data) }
      setShowModal(false)
      loadProducts()
    } catch (err) { setError(err.response?.data?.error || '儲存失敗') }
  }

  const handleDelete = async (id) => { if (confirm('確定要刪除嗎？')) { await api.deleteProduct(id); loadProducts() } }

  const getStockStatus = (p) => {
    if (p.quantity === 0) return 'badge-danger'
    if (p.quantity <= p.min_stock) return 'badge-warning'
    return 'badge-success'
  }

  if (loading) return <div className="loading">載入中...</div>

  return (
    <div>
      <div className="page-header">
        <h1>庫存管理</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={`btn ${filterLowStock ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setFilterLowStock(!filterLowStock)}>
            {filterLowStock ? '顯示全部' : '低庫存警示'}
          </button>
          <button className="btn btn-primary" onClick={openCreate}>新增產品</button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          {products.length > 0 ? (
            <table>
              <thead><tr><th>名稱</th><th>SKU</th><th>類別</th><th>售價</th><th>成本</th><th>庫存</th><th>狀態</th><th>操作</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.sku || '-'}</td>
                    <td>{p.category || '-'}</td>
                    <td>${p.price.toLocaleString()}</td>
                    <td>${p.cost.toLocaleString()}</td>
                    <td>{p.quantity} {p.unit || ''}</td>
                    <td><span className={`badge ${getStockStatus(p)}`}>{p.quantity <= p.min_stock ? '低庫存' : '正常'}</span></td>
                    <td className="actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>編輯</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>刪除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty-state">{filterLowStock ? '沒有低庫存產品' : '尚無產品資料'}</div>}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editData ? '編輯產品' : '新增產品'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>名稱 *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-group"><label>SKU</label><input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
                <div className="form-group"><label>類別</label><input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} list="categories" /><datalist id="categories">{categories.map(c => <option key={c} value={c} />)}</datalist></div>
                <div className="form-group"><label>單位</label><input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="如: 件、箱、個" /></div>
                <div className="form-group"><label>售價 *</label><input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required /></div>
                <div className="form-group"><label>成本</label><input type="number" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} /></div>
                <div className="form-group"><label>庫存數量</label><input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
                <div className="form-group"><label>最低庫存</label><input type="number" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: e.target.value })} /></div>
                <div className="form-group full"><label>描述</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="3" /></div>
              </div>
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