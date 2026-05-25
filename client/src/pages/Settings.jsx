import { useState, useEffect } from 'react'
import api from '../api'

export default function Settings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [newSubCategory, setNewSubCategory] = useState('')
  const [selectedParent, setSelectedParent] = useState('')
  const [editCategory, setEditCategory] = useState(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    api.getSettings().then(res => setSettings(res.data)).finally(() => setLoading(false))
    loadCategories()
  }, [])

  const loadCategories = () => {
    api.getCategories().then(res => setCategories(res.data)).catch(() => {})
  }

  const handleChange = (key, value) => setSettings({ ...settings, [key]: value })

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateSettings(settings)
      setMessage('設定已儲存')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    try {
      await api.createCategory({ name: newCategory.trim() })
      setNewCategory('')
      loadCategories()
    } catch (err) {
      alert('新增失敗')
    }
  }

  const handleAddSubCategory = async () => {
    if (!newSubCategory.trim() || !selectedParent) return
    try {
      await api.createCategory({ name: newSubCategory.trim(), parent_id: selectedParent })
      setNewSubCategory('')
      loadCategories()
    } catch (err) {
      alert('新增失敗')
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!confirm('確定要刪除嗎？')) return
    try {
      await api.deleteCategory(id)
      loadCategories()
    } catch (err) {
      alert('刪除失敗')
    }
  }

  const handleUpdateCategory = async (id) => {
    if (!editName.trim()) return
    try {
      await api.updateCategory(id, { name: editName.trim() })
      setEditCategory(null)
      setEditName('')
      loadCategories()
    } catch (err) {
      alert('更新失敗')
    }
  }

  const getParentCategories = () => categories.filter(c => !c.parent_id)
  const getChildCategories = (parentId) => categories.filter(c => c.parent_id === parentId)

  if (loading) return <div className="loading">載入中...</div>

  return (
    <div>
      <div className="page-header">
        <h1>系統設定</h1>
        {message && <span className={message.includes('失敗') ? 'alert alert-error' : 'alert alert-success'} style={{ padding: '0.5rem 1rem' }}>{message}</span>}
      </div>
      {/*
      <div className="card">
        <div className="card-header"><span className="card-title">基本設定</span></div>
        <div className="form-grid">
          <div className="form-group"><label>公司名稱</label><input value={settings.company_name || ''} onChange={e => handleChange('company_name', e.target.value)} /></div>
          <div className="form-group"><label>幣別</label><input value={settings.currency || ''} onChange={e => handleChange('currency', e.target.value)} placeholder="如: TWD, USD" /></div>
          <div className="form-group"><label>低庫存警示數量</label><input type="number" value={settings.low_stock_threshold || ''} onChange={e => handleChange('low_stock_threshold', e.target.value)} /></div>
          <div className="form-group"><label>稅率 (%)</label><input type="number" step="0.01" value={settings.tax_rate || ''} onChange={e => handleChange('tax_rate', e.target.value)} /></div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? '儲存中...' : '儲存設定'}</button>
        </div>
      </div>
      */}

      <div className="card">
        <div className="card-header"><span className="card-title">庫存類別管理</span></div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '0.5rem' }}>新增主類別</h4>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              value={newCategory} 
              onChange={e => setNewCategory(e.target.value)} 
              placeholder="輸入類別名稱"
              onKeyPress={e => e.key === 'Enter' && handleAddCategory()}
            />
            <button className="btn btn-primary" onClick={handleAddCategory}>新增</button>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '0.5rem' }}>新增子類別</h4>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select value={selectedParent} onChange={e => setSelectedParent(e.target.value)} style={{ minWidth: '150px' }}>
              <option value="">選擇主類別</option>
              {getParentCategories().map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input 
              value={newSubCategory} 
              onChange={e => setNewSubCategory(e.target.value)} 
              placeholder="輸入子類別名稱"
              onKeyPress={e => e.key === 'Enter' && handleAddSubCategory()}
            />
            <button className="btn btn-primary" onClick={handleAddSubCategory} disabled={!selectedParent}>新增</button>
          </div>
        </div>

        <div className="category-list">
          {getParentCategories().length > 0 ? (
            getParentCategories().map(parent => (
              <div key={parent.id} style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  {editCategory === parent.id ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '150px' }} />
                      <button className="btn btn-primary btn-sm" onClick={() => handleUpdateCategory(parent.id)}>儲存</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditCategory(null); setEditName('') }}>取消</button>
                    </div>
                  ) : (
                    <>
                      <strong>{parent.name}</strong>
                      <div>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditCategory(parent.id); setEditName(parent.name) }} style={{ marginRight: '0.25rem' }}>編輯</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCategory(parent.id)}>刪除</button>
                      </div>
                    </>
                  )}
                </div>
                {getChildCategories(parent.id).length > 0 && (
                  <div style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                    {getChildCategories(parent.id).map(child => (
                      <div key={child.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'white', marginBottom: '0.25rem', borderRadius: '4px' }}>
                        {editCategory === child.id ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '150px' }} />
                            <button className="btn btn-primary btn-sm" onClick={() => handleUpdateCategory(child.id)}>儲存</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => { setEditCategory(null); setEditName('') }}>取消</button>
                          </div>
                        ) : (
                          <>
                            <span>{child.name}</span>
                            <div>
                              <button className="btn btn-secondary btn-sm" onClick={() => { setEditCategory(child.id); setEditName(child.name) }} style={{ marginRight: '0.25rem' }}>編輯</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCategory(child.id)}>刪除</button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p style={{ color: '#999' }}>尚無類別資料</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">預設帳號</span></div>
        <p style={{ color: '#666', marginBottom: '1rem' }}>預設管理員帳號: <strong>admin</strong> / <strong>admin123</strong></p>
        <p style={{ color: '#999', fontSize: '0.875rem' }}>請立即修改預設密碼以確保系統安全。</p>
      </div>
    </div>
  )
}