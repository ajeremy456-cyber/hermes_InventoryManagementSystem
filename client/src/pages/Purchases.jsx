import { useState, useEffect } from 'react'
import api from '../api'

export default function Purchases() {
  const [purchases, setPurchases] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ supplier: '', payment_status: 'pending', note: '' })
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  const loadData = () => {
    Promise.all([api.getPurchases(), api.getProducts()])
      .then(([purchasesRes, productsRes]) => {
        setPurchases(purchasesRes.data)
        setProducts(productsRes.data)
      }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const openCreate = () => { setForm({ supplier: '', payment_status: 'pending', note: '' }); setItems([]); setError(''); setShowModal(true) }

  const addItem = (productId) => {
    const product = products.find(p => p.id === productId)
    if (!product || items.find(i => i.product_id === productId)) return
    setItems([...items, { product_id: productId, name: product.name, quantity: 1, unit_cost: product.cost || 0 }])
  }

  const updateItem = (productId, field, value) => {
    setItems(items.map(i => i.product_id === productId ? { ...i, [field]: value } : i))
  }

  const removeItem = (productId) => setItems(items.filter(i => i.product_id !== productId))

  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unit_cost, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) { setError('請選擇至少一個產品'); return }
    try {
      await api.createPurchase({ ...form, items })
      setShowModal(false)
      loadData()
    } catch (err) { setError(err.response?.data?.error || '建立失敗') }
  }

  const handleDelete = async (id) => {
    if (!confirm('確定要刪除並還原庫存嗎？')) return
    await api.deletePurchase(id)
    loadData()
  }

  const handleStatusChange = async (id, status) => {
    await api.updatePurchaseStatus(id, { payment_status: status })
    loadData()
  }

  if (loading) return <div className="loading">載入中...</div>

  return (
    <div>
      <div className="page-header">
        <h1>進貨管理</h1>
        <button className="btn btn-primary" onClick={openCreate}>新增進貨</button>
      </div>

      <div className="card">
        <div className="table-container">
          {purchases.length > 0 ? (
            <table>
              <thead><tr><th>日期</th><th>供應商</th><th>金額</th><th>付款狀態</th><th>操作</th></tr></thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id}>
                    <td>{new Date(p.created_at).toLocaleString()}</td>
                    <td>{p.supplier || '-'}</td>
                    <td>${p.total_amount.toLocaleString()}</td>
                    <td>
                      <select value={p.payment_status} onChange={e => handleStatusChange(p.id, e.target.value)} className={`badge ${p.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`} style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}>
                        <option value="pending">待付款</option>
                        <option value="paid">已付款</option>
                      </select>
                    </td>
                    <td className="actions"><button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>刪除</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty-state">尚無進貨記錄</div>}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>新增進貨</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>供應商</label><input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} /></div>
                <div className="form-group"><label>付款狀態</label><select value={form.payment_status} onChange={e => setForm({ ...form, payment_status: e.target.value })}><option value="pending">待付款</option><option value="paid">已付款</option></select></div>
              </div>

              <div style={{ margin: '1rem 0' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>選擇產品</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {products.map(p => <button type="button" key={p.id} className={`btn btn-sm ${items.find(i => i.product_id === p.id) ? 'btn-primary' : 'btn-secondary'}`} onClick={() => addItem(p.id)}>{p.name}</button>)}
                </div>
              </div>

              {items.length > 0 && (
                <div style={{ margin: '1rem 0' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>進貨項目</label>
                  {items.map(item => (
                    <div key={item.product_id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', padding: '0.5rem', background: '#f8f9fa', borderRadius: '6px' }}>
                      <span style={{ flex: 1 }}>{item.name}</span>
                      <input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.product_id, 'quantity', parseInt(e.target.value))} style={{ width: '60px', padding: '0.4rem' }} />
                      <input type="number" step="0.01" value={item.unit_cost} onChange={e => updateItem(item.product_id, 'unit_cost', parseFloat(e.target.value))} style={{ width: '80px', padding: '0.4rem' }} placeholder="成本" />
                      <span>= ${(item.quantity * item.unit_cost).toLocaleString()}</span>
                      <button type="button" onClick={() => removeItem(item.product_id)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-group"><label>備註</label><textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows="2" /></div>

              <div style={{ textAlign: 'right', fontSize: '1.2rem', marginTop: '1rem' }}>總計: <strong>${totalAmount.toLocaleString()}</strong></div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-success">完成進貨</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}