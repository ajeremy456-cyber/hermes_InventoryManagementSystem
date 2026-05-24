import { useState, useEffect } from 'react'
import api from '../api'

export default function Settings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.getSettings().then(res => setSettings(res.data)).finally(() => setLoading(false))
  }, [])

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

  if (loading) return <div className="loading">載入中...</div>

  return (
    <div>
      <div className="page-header">
        <h1>系統設定</h1>
        {message && <span className={message.includes('失敗') ? 'alert alert-error' : 'alert alert-success'} style={{ padding: '0.5rem 1rem' }}>{message}</span>}
      </div>

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

      <div className="card">
        <div className="card-header"><span className="card-title">預設帳號</span></div>
        <p style={{ color: '#666', marginBottom: '1rem' }}>預設管理員帳號: <strong>admin</strong> / <strong>admin123</strong></p>
        <p style={{ color: '#999', fontSize: '0.875rem' }}>請立即修改預設密碼以確保系統安全。</p>
      </div>
    </div>
  )
}