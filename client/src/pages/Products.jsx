import { useState, useEffect, useMemo } from 'react'
import api from '../api'
import Pagination from '../components/Pagination'

const ITEMS_PER_PAGE = 30

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [form, setForm] = useState({ name: '', category_id: '', sub_category_id: '', price: '', cost: '', quantity: '', min_stock: '10', unit: '', description: '' })
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const loadProducts = () => {
    if (searchKeyword.trim()) {
      api.searchProducts(searchKeyword).then(res => { setProducts(res.data); setCurrentPage(1) }).finally(() => setLoading(false))
    } else if (filterLowStock) {
      api.getProducts({ lowStock: 'true' }).then(res => { setProducts(res.data); setCurrentPage(1) }).finally(() => setLoading(false))
    } else {
      api.getProducts().then(res => { setProducts(res.data); setCurrentPage(1) }).finally(() => setLoading(false))
    }
  }

  useEffect(() => { loadProducts() }, [filterLowStock, searchKeyword])
  useEffect(() => { api.getCategories().then(res => setCategories(res.data)).catch(() => {}) }, [])

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return products.slice(start, start + ITEMS_PER_PAGE)
  }, [products, currentPage])

  const getParentCategories = () => categories.filter(c => !c.parent_id)
  const getChildCategories = (parentId) => categories.filter(c => c.parent_id === parentId)

  const handleCategoryChange = (categoryId) => {
    setForm({ ...form, category_id: categoryId, sub_category_id: '' })
  }

  const openCreate = () => { 
    setEditData(null); 
    setForm({ name: '', category_id: '', sub_category_id: '', price: '', cost: '', quantity: '', min_stock: '10', unit: '', description: '' }); 
    setError(''); 
    setShowModal(true) 
  }
  
  const openEdit = (p) => {
    setEditData(p)
    setForm({ 
      name: p.name, 
      category_id: p.category_id || '', 
      sub_category_id: p.sub_category_id || '', 
      price: p.price, 
      cost: p.cost, 
      quantity: p.quantity, 
      min_stock: p.min_stock, 
      unit: p.unit || '', 
      description: p.description || '' 
    })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { 
        ...form, 
        price: parseFloat(form.price), 
        cost: parseFloat(form.cost) || 0, 
        quantity: parseInt(form.quantity) || 0, 
        min_stock: parseInt(form.min_stock) || 10 
      }
      if (editData) { await api.updateProduct(editData.id, data) } else { await api.createProduct(data) }
      setShowModal(false)
      loadProducts()
    } catch (err) { setError(err.response?.data?.error || '儲存失敗') }
  }

  const handleDelete = async (id) => { if (confirm('確定要刪除嗎？')) { await api.deleteProduct(id); loadProducts() } }

  const exportToCSV = () => {
    if (products.length === 0) { alert('沒有資料可以匯出'); return }
    
    const headers = ['名稱', '主類別', '子類別', '售價', '成本', '庫存', '單位', '最低庫存', '描述', '建立時間']
    const rows = products.map(p => {
      const parent = categories.find(c => c.id === p.category_id)
      const child = categories.find(c => c.id === p.sub_category_id)
      return [
        p.name,
        parent?.name || '',
        child?.name || '',
        p.price,
        p.cost,
        p.quantity,
        p.unit || '',
        p.min_stock,
        (p.description || '').replace(/"/g, '""'),
        p.created_at ? new Date(p.created_at).toLocaleString('zh-TW') : ''
      ]
    })
    
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `產品列表_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getStockStatus = (p) => {
    if (p.quantity === 0) return 'badge-danger'
    if (p.quantity <= p.min_stock) return 'badge-warning'
    return 'badge-success'
  }

  const getCategoryDisplay = (p) => {
    const parent = categories.find(c => c.id === p.category_id)
    const child = categories.find(c => c.id === p.sub_category_id)
    if (child) return `${parent?.name || ''} / ${child.name}`
    if (parent) return parent.name
    return '-'
  }

  if (loading) return <div className="loading">載入中...</div>

  return (
    <div>
      <div className="page-header">
        <h1>庫存管理</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={exportToCSV}>匯出 CSV</button>
          <button className={`btn ${filterLowStock ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setFilterLowStock(!filterLowStock)}>
            {filterLowStock ? '顯示全部' : '低庫存警示'}
          </button>
          <button className="btn btn-primary" onClick={openCreate}>新增產品</button>
        </div>
      </div>
          <div className="search-bar">
            <input 
          type="text" 
          placeholder="輸入名稱/類別." 
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
            />
          </div>
      <div className="card">
        <div className="table-container">
          {products.length > 0 ? (
            <>
              <table>
                <thead><tr><th>名稱</th><th>類別</th><th>售價</th><th>成本</th><th>庫存</th><th>狀態</th><th>操作</th></tr></thead>
                <tbody>
                  {paginatedProducts.map(p => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{getCategoryDisplay(p)}</td>
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
              <Pagination
                currentPage={currentPage}
                totalItems={products.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </>
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
                <div className="form-group">
                  <label>主類別</label>
                  <select value={form.category_id} onChange={e => handleCategoryChange(e.target.value)}>
                    <option value="">選擇主類別</option>
                    {getParentCategories().map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>子類別</label>
                  <select value={form.sub_category_id} onChange={e => setForm({ ...form, sub_category_id: e.target.value })} disabled={!form.category_id}>
                    <option value="">選擇子類別</option>
                    {form.category_id && getChildCategories(form.category_id).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
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