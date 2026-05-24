import { useState, useEffect } from 'react'
import api from '../api'

export default function Sales() {
  const [sales, setSales] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ customer_id: '', discount: 0, payment_method: 'cash', note: '' })
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  const loadData = () => {
    Promise.all([api.getSales(), api.getCustomers(), api.getProducts()])
      .then(([salesRes, customersRes, productsRes]) => {
        setSales(salesRes.data)
        setCustomers(customersRes.data)
        setProducts(productsRes.data)
      }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const openCreate = () => { setForm({ customer_id: '', discount: 0, payment_method: 'cash', note: '' }); setItems([]); setError(''); setShowModal(true) }

  const addItem = (productId) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    if (items.find(i => i.product_id === productId)) return
    setItems([...items, { product_id: productId, name: product.name, quantity: 1, unit_price: product.price }])
  }

  const updateItem = (productId, field, value) => {
    setItems(items.map(i => i.product_id === productId ? { ...i, [field]: value } : i))
  }

  const removeItem = (productId) => setItems(items.filter(i => i.product_id !== productId))

  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
  const finalAmount = totalAmount - form.discount

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) { setError('請選擇至少一個產品'); return }
    try {
      await api.createSale({ ...form, items })
      setShowModal(false)
      loadData()
    } catch (err) { setError(err.response?.data?.error || '建立失敗') }
  }

  const handleDelete = async (id) => {
    if (!confirm('確定要刪除並還原庫存嗎？')) return
    await api.deleteSale(id)
    loadData()
  }

  if (loading) return <div className="loading">載入中...</div>

  return (
    <div>
      <div className="page-header">
        <h1>銷售管理</h1>
        <button className="btn btn-primary" onClick={openCreate}>新增銷售</button>
      </div>

      <div className="card">
        <div className="table-container">
          {sales.length > 0 ? (
            <table>
              <thead><tr><th>日期</th><th>客戶</th><th>金額</th><th>折扣</th><th>實收</th><th>付款</th><th>操作</th></tr></thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.id}>
                    <td>{new Date(s.created_at).toLocaleString()}</td>
                    <td>{s.customer_name || '散客'}</td>
                    <td>${s.total_amount.toLocaleString()}</td>
                    <td>${s.discount || 0}</td>
                    <td>${s.final_amount.toLocaleString()}</td>
                    <td><span className="badge badge-success">{s.payment_method}</span></td>
                    <td className="actions"><button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>刪除</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty-state">尚無銷售記錄</div>}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>新增銷售</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>客戶</label><select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}><option value="">散客</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div className="form-group"><label>付款方式</label><select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}><option value="cash">現金</option><option value="card">信用卡</option><option value="transfer">轉帳</option></select></div>
              </div>

              <div style={{ margin: '1rem 0' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>選擇產品</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {products.map(p => <button type="button" key={p.id} className={`btn btn-sm ${items.find(i => i.product_id === p.id) ? 'btn-primary' : 'btn-secondary'}`} onClick={() => addItem(p.id)}>{p.name} (${p.price})</button>)}
                </div>
              </div>

              {items.length > 0 && (
                <div style={{ margin: '1rem 0' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>銷售項目</label>
                  {items.map(item => (
                    <div key={item.product_id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', padding: '0.5rem', background: '#f8f9fa', borderRadius: '6px' }}>
                      <span style={{ flex: 1 }}>{item.name}</span>
                      <input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.product_id, 'quantity', parseInt(e.target.value))} style={{ width: '60px', padding: '0.4rem' }} />
                      <span>× ${item.unit_price}</span>
                      <span>= ${(item.quantity * item.unit_price).toLocaleString()}</span>
                      <button type="button" onClick={() => removeItem(item.product_id)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-grid">
                <div className="form-group"><label>折扣</label><input type="number" step="0.01" value={form.discount} onChange={e => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })} /></div>
                <div className="form-group"><label>備註</label><input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '1.2rem', marginTop: '1rem' }}>
                總計: ${totalAmount.toLocaleString()} → <strong>實收: ${finalAmount.toLocaleString()}</strong>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-success">完成銷售</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}