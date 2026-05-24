import { useState, useEffect } from 'react'
import api from '../api'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({ license_plate: '', name: '', phone: '', car_model: '', manufacture_date: '' })
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

  const openCreate = () => { setEditData(null); setForm({ license_plate: '', name: '', phone: '', car_model: '', manufacture_date: '' }); setError(''); setShowModal(true) }
  const openEdit = (c) => { setEditData(c); setForm({ license_plate: c.license_plate || '', name: c.name || '', phone: c.phone || '', car_model: c.car_model || '', manufacture_date: c.manufacture_date || '' }); setError(''); setShowModal(true) }

 const calculateInspection = () => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const currentYear = now.getFullYear()

  // 系統想抓取的通知範圍（例如：上個月到下下個月）
  const monthStart = new Date(currentYear, now.getMonth() - 1, 1)
  const monthEnd = new Date(currentYear, now.getMonth() + 2, 0, 23, 59, 59, 999)

  const list = []

  customers.forEach((customer, index) => { // 💡 修正點 1：這裡加上了 (customer, index)
  if (!customer.manufacture_date) return
  const dateStr = String(customer.manufacture_date).replace(/-/g, '/');
  const manufactureDate = new Date(dateStr);
  if (isNaN(manufactureDate.getTime())) {
    console.warn(`第 ${index} 筆客戶資料日期解析失敗:`, customer.manufacture_date)
    return // 如果是 Invalid Date 就直接跳過這隻，不往下跑
  } // 💡 修正點 2：補上原本漏掉的 if 結束大括號

  const mYear = manufactureDate.getFullYear()
  const mMonth = manufactureDate.getMonth() // 0-11
  const mDate = manufactureDate.getDate()

  // 1. 用年份直接切車齡級距（台灣監理所標準標準：當前年份 - 出廠年份）
  const carAge = currentYear - mYear

  if (carAge < 5) return // 未滿 5 年免驗

  const inspectionType = carAge >= 10 ? '每半年驗車' : '每年驗車'
  const targetDates = []

  // 2. 計算今年這台車的「第一次檢驗基準日」
  const firstTarget = new Date(currentYear, mMonth, mDate)
  targetDates.push(firstTarget)

  // 3. 如果滿 10 年，計算「第二次檢驗基準日」（半年後）
  if (carAge >= 10) {
    const secondTarget = new Date(currentYear, mMonth + 6, mDate)
    targetDates.push(secondTarget)
  }

  // 4. 檢查這些基準日對應的「驗車截止日」有沒有落在我們要的通知區間內
  targetDates.forEach(baseDate => {
    // 台灣法規：基準日前一個月 1 號，至基準日後一個月最後一天（以月份為大限）
    const inspectionStart = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, baseDate.getDate())
    const inspectionEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, baseDate.getDate(), 23, 59, 59)

    // 只要「驗車截止日」或整個區間有跟通知視窗重疊，就撈出來
    if (inspectionEnd >= monthStart && inspectionStart <= monthEnd) {
      list.push({
        ...customer,
        inspectionType,
        // 💡 修正點 3：補上這個欄位，確保你原本的前端畫面能順利讀到日期！
        nextInspectionDate: inspectionEnd, 
        inspectionRange: {
          start: inspectionStart.toLocaleDateString('zh-TW'),
          end: inspectionEnd.toLocaleDateString('zh-TW'),
          base: baseDate.toLocaleDateString('zh-TW')
        },
        // 保留 Date 物件供後面排序使用（以截止日排序最符合提醒直覺）
        sortDate: inspectionEnd 
      })
    }
  })
})

// 依據截止日期由近到遠排序
list.sort((a, b) => a.sortDate - b.sortDate)

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
        <h1>車輛管理</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={calculateInspection}>驗車提醒</button>
          <button className="btn btn-primary" onClick={openCreate}>新增車輛</button>
        </div>
      </div>

      <div className="search-bar">
        <input 
          type="text" 
          placeholder="輸入車牌、姓名或電話搜尋..." 
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="table-container">
          {customers.length > 0 ? (
            <table>
              <thead><tr><th>車牌</th><th>姓名</th><th>手機號碼</th><th>車型</th><th>車輛出廠/領照日期</th><th>上次到廠日期</th><th>操作</th></tr></thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td>{c.license_plate || '-'}</td>
                    <td>{c.name}</td>
                    <td>{c.phone || '-'}</td>
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
          ) : <div className="empty-state">尚無車輛資料</div>}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editData ? '編輯車輛' : '新增車輛'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>車牌 *</label><input value={form.license_plate} onChange={e => setForm({ ...form, license_plate: e.target.value })} required /></div>
              <div className="form-group"><label>姓名*</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-group"><label>手機號碼 *</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required /></div>
              <div className="form-group"><label>車型</label><input value={form.car_model} onChange={e => setForm({ ...form, car_model: e.target.value })} /></div>
              <div className="form-group"><label>車輛出廠/領照日期</label><input type="date" value={form.manufacture_date} onChange={e => setForm({ ...form, manufacture_date: e.target.value })} /></div>
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
              <h2>驗車提醒（近三個月）</h2>
              <button className="modal-close" onClick={() => setShowInspectionModal(false)}>×</button>
            </div>
            {inspectionList.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>車牌</th>
                      <th>客戶姓名</th>
                      <th>手機號碼</th>
                      <th>驗車截止日期</th>
                      <th>驗車類型</th>
                      <th>狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectionList.map(c => {
                        return (
                          <tr key={c.id}>
                            <td>{c.license_plate || '-'}</td>
                            <td>{c.name || '-'}</td>
                            <td>{c.phone || '-'}</td>
                            <td>{new Date(c.nextInspectionDate).toLocaleDateString()}</td>
                            <td><span className={`badge ${c.inspectionType === '每年驗車' ? 'badge-warning' : 'badge-danger'}`}>{c.inspectionType}</span></td>
                            <td><span className="badge badge-info">臨近驗車</span></td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">三個月內沒有需要驗車的車輛</div>
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