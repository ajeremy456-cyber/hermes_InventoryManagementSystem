import { useState, useEffect, useMemo } from 'react'
import api from '../api'
import Pagination from '../components/Pagination'

const ITEMS_PER_PAGE = 30

export default function Sales() {
  const [sales, setSales] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [form, setForm] = useState({ customer_id: '', invoice_number: '', discount: 0, payment_method: 'cash', note: '', next_service_date: '' })
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const loadData = () => {
    Promise.all([api.getSales(), api.getCustomers(), api.getProducts()])
      .then(([salesRes, customersRes, productsRes]) => {
        setSales(salesRes.data)
        setCustomers(customersRes.data)
        setProducts(productsRes.data)
        setCurrentPage(1)
      }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return sales.slice(start, start + ITEMS_PER_PAGE)
  }, [sales, currentPage])

  const getVehicleDisplay = (s) => {
    if (s.vehicle_plate) {
      return `${s.vehicle_plate} - ${s.customer_name || ''}`
    }
    return s.customer_name || '散客'
  }

  const openCreate = () => { 
    setForm({ customer_id: '', invoice_number: '', discount: 0, payment_method: 'cash', note: '', next_service_date: '' }); 
    setItems([]); 
    setError(''); 
    setProductSearch('')
    setShowModal(true) 
  }

  const calculateNextServiceDate = (months) => {
    const date = new Date()
    date.setMonth(date.getMonth() + months)
    return date.toISOString().split('T')[0]
  }

  const setQuickServiceDate = (months) => {
    setForm({ ...form, next_service_date: calculateNextServiceDate(months) })
  }

  const viewOrder = async (saleId) => {
    // Open new tab with print receipt
    window.open(`/print/${saleId}`, '_blank')
  }

  const printOrder = () => {
    window.print()
  }

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

  const filteredProducts = productSearch.trim()
    ? products.filter(p => 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.category_name && p.category_name.toLowerCase().includes(productSearch.toLowerCase())) ||
        (p.sub_category_name && p.sub_category_name.toLowerCase().includes(productSearch.toLowerCase()))
      )
    : products

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

  const exportToCSV = () => {
    if (sales.length === 0) { alert('沒有資料可以匯出'); return }
    
    const headers = ['訂單編號', '日期', '車牌/客戶', '發票號碼', '總金額', '折扣', '實收金額', '付款方式', '備註']
    const rows = sales.map(s => [
      s.order_number || '',
      new Date(s.created_at).toLocaleString('zh-TW'),
      getVehicleDisplay(s),
      s.invoice_number || '',
      s.total_amount,
      s.discount || 0,
      s.final_amount,
      s.payment_method,
      (s.note || '').replace(/"/g, '""')
    ])
    
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `銷售列表_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="loading">載入中...</div>

  return (
    <div>
      <div className="page-header">
        <h1>銷售管理</h1>
        <button className="btn btn-secondary" onClick={exportToCSV}>匯出 CSV</button>
        <button className="btn btn-primary" onClick={openCreate}>新增銷售</button>
      </div>

      <div className="card">
        <div className="table-container">
          {sales.length > 0 ? (
            <>
              <table>
                <thead><tr><th>訂單編號</th><th>日期</th><th>車牌 / 客戶</th><th>發票號碼</th><th>金額</th><th>付款</th><th>操作</th></tr></thead>
                <tbody>
                  {paginatedSales.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.order_number || '-'}</strong></td>
                      <td>{new Date(s.created_at).toLocaleString()}</td>
                      <td>{getVehicleDisplay(s)}</td>
                      <td>{s.invoice_number || '-'}</td>
                      <td>${s.final_amount.toLocaleString()}</td>
                      <td><span className="badge badge-success">{s.payment_method}</span></td>
                      <td className="actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => viewOrder(s.id)}>檢視</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>刪除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                currentPage={currentPage}
                totalItems={sales.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </>
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
                <div className="form-group">
                  <label>車牌 / 客戶</label>
                  <select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
                    <option value="">散客</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.license_plate || '未填車牌'} - {c.name || ''} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group"><label>發票號碼</label><input value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} placeholder="可留空" /></div>
                <div className="form-group"><label>付款方式</label><select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}><option value="cash">現金</option><option value="card">信用卡</option><option value="transfer">轉帳</option></select></div>
              </div>

              <div style={{ margin: '1rem 0' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>選擇商品</label>
                <input 
                  type="text" 
                  placeholder="搜尋商品名稱或類別..." 
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}
                />
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '6px', padding: '0.5rem' }}>
                  {filteredProducts.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {filteredProducts.map(p => (
                        <button 
                          type="button" 
                          key={p.id} 
                          className={`btn btn-sm ${items.find(i => i.product_id === p.id) ? 'btn-primary' : 'btn-secondary'}`} 
                          onClick={() => addItem(p.id)}
                        >
                          {p.name} (${p.price})
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#999', textAlign: 'center' }}>找不到商品</p>
                  )}
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

              <div style={{ margin: '1rem 0', padding: '1rem', background: '#e8f4f8', borderRadius: '8px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>下次回廠時間</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input 
                    type="date" 
                    value={form.next_service_date} 
                    onChange={e => setForm({ ...form, next_service_date: e.target.value })}
                    style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px', minWidth: '150px' }}
                  />
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setQuickServiceDate(6)}>6個月</button>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setQuickServiceDate(12)}>12個月</button>
                  {form.next_service_date && (
                    <button type="button" className="btn btn-sm btn-link" onClick={() => setForm({ ...form, next_service_date: '' })} style={{ color: '#dc3545', textDecoration: 'none' }}>清除</button>
                  )}
                </div>
                {form.next_service_date && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                    預計回廠日期：{new Date(form.next_service_date + 'T00:00:00').toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                )}
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

      {showOrderModal && currentOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal" style={{ maxWidth: '520px', maxHeight: '95vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>銷售收據 - {currentOrder.order_number}</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={printOrder}>列印</button>
                <button className="modal-close" onClick={() => setShowOrderModal(false)}>×</button>
              </div>
            </div>
            
            <div style={{ 
              padding: '0.5rem', 
              backgroundColor: '#fff',
              color: '#000',
              fontFamily: '"Courier New", "Menlo", "Monaco", "Consolas", "Liberation Mono", monospace',
              fontSize: '13px',
              lineHeight: '1.4',
              margin: '0.5rem'
            }}>
              {/* 店头 */}
              <div style={{ textAlign: 'center', paddingBottom: '4px', marginBottom: '4px', borderBottom: '1px dashed #000' }}>
                <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '2px' }}>萬詠國際貿易有限公司</div>
                <div style={{ fontSize: '11px' }}>TEL: 05-5871980</div>
              </div>
              
              {/* 分隔线 */}
              <div style={{ textAlign: 'center', margin: '4px 0', letterSpacing: '0' }}>========================================</div>
              
              {/* 订单信息 - 使用table固定宽度 */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '50%', padding: '0' }}>訂單: {currentOrder.order_number || '-'}</td>
                    <td style={{ width: '50%', padding: '0', textAlign: 'right' }}>日期: {new Date(currentOrder.created_at).toLocaleDateString('zh-TW')}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0' }}>客戶: {currentOrder.customer_name || '散客'}</td>
                    <td style={{ padding: '0', textAlign: 'right' }}>{currentOrder.vehicle_plate ? '車牌: ' + currentOrder.vehicle_plate : ''}</td>
                  </tr>
                </tbody>
              </table>
              
              {/* 分隔线 */}
              <div style={{ textAlign: 'center', margin: '4px 0', letterSpacing: '0' }}>----------------------------------------</div>
              
              {/* 商品明细 - 固定表格 */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
                <thead>
                  <tr style={{ fontWeight: 'bold', borderBottom: '1px dashed #000' }}>
                    <th style={{ width: '50%', textAlign: 'left', padding: '2px 0', fontWeight: 'normal' }}>品名</th>
                    <th style={{ width: '15%', textAlign: 'center', padding: '2px 0', fontWeight: 'normal' }}>數量</th>
                    <th style={{ width: '17.5%', textAlign: 'right', padding: '2px 0', fontWeight: 'normal' }}>單價</th>
                    <th style={{ width: '17.5%', textAlign: 'right', padding: '2px 0', fontWeight: 'normal' }}>小計</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrder.items?.map((item, index) => (
                    <tr key={index}>
                      <td style={{ padding: '2px 0', wordBreak: 'break-word' }}>{item.product_name || item.name}</td>
                      <td style={{ textAlign: 'center', padding: '2px 0' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', padding: '2px 0' }}>${item.unit_price?.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', padding: '2px 0' }}>${item.subtotal?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* 分隔线 */}
              <div style={{ textAlign: 'center', margin: '4px 0', letterSpacing: '0' }}>----------------------------------------</div>
              
              {/* 金额总计 */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '1px 0' }}>總    計:</td>
                    <td style={{ textAlign: 'right', padding: '1px 0' }}>${currentOrder.total_amount?.toLocaleString()}</td>
                  </tr>
                  {currentOrder.discount > 0 && (
                    <tr>
                      <td style={{ padding: '1px 0' }}>折    扣:</td>
                      <td style={{ textAlign: 'right', padding: '1px 0' }}>-${currentOrder.discount?.toLocaleString()}</td>
                    </tr>
                  )}
                  <tr style={{ fontWeight: 'bold', borderTop: '1px dashed #000', paddingTop: '2px' }}>
                    <td style={{ padding: '2px 0' }}>應收金額:</td>
                    <td style={{ textAlign: 'right', padding: '2px 0' }}>${currentOrder.final_amount?.toLocaleString()}</td>
                  </tr>
                  <tr style={{ fontSize: '11px' }}>
                    <td style={{ padding: '1px 0' }}>已    付：________</td>
                    <td style={{ textAlign: 'right', padding: '1px 0' }}>未    付：________</td>
                  </tr>
                </tbody>
              </table>
              
              {/* 分隔线 */}
              <div style={{ textAlign: 'center', margin: '4px 0', letterSpacing: '0' }}>----------------------------------------</div>
              
              {/* 付款资讯 */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '60%', padding: '1px 0' }}>
                      付款方式: {
                        currentOrder.payment_method === 'cash' ? '■現金 □信用卡 □轉帳' :
                        currentOrder.payment_method === 'card' ? '□現金 □信用卡 ■轉帳' :
                        '□現金 ■信用卡 □轉帳'
                      }
                    </td>
                    <td style={{ width: '40%', padding: '1px 0', textAlign: 'right' }}>
                      {currentOrder.invoice_number ? '發票: ' + currentOrder.invoice_number : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ width: '60%', padding: '1px 0' }}>
                      {currentOrder.next_service_date ? '下次回廠: ' + new Date(currentOrder.next_service_date + 'T00:00:00').toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                    </td>
                    <td style={{ width: '40%', padding: '1px 0', textAlign: 'right' }}>
                      備註: {currentOrder.note || '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
              
              {/* 分隔线 */}
              <div style={{ textAlign: 'center', margin: '4px 0', letterSpacing: '0' }}>========================================</div>
              
              {/* 签名栏 */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', fontSize: '11px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '2px 0', width: '33%' }}>會  計：________</td>
                    <td style={{ padding: '2px 0', width: '34%', textAlign: 'center' }}>倉  管：________</td>
                    <td style={{ padding: '2px 0', width: '33%', textAlign: 'right' }}>客戶簽收：________</td>
                  </tr>

                </tbody>
              </table>
              
              {/* 分隔线 */}
              <div style={{ textAlign: 'center', marginTop: '8px', letterSpacing: '0' }}>========================================</div>
              
              {/* 页脚 */}
             
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>關閉</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}