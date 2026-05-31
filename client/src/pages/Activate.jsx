import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Activate() {
  const [licenseKey, setLicenseKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { handleLicenseActivated } = useAuth()
  const navigate = useNavigate()

  const handleActivate = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 驗證授權碼
      const verifyRes = await api.verifyLicense(licenseKey)
      
      if (verifyRes.data.valid) {
        // 激活授權
        await api.activateLicense(licenseKey)
        alert('授權激活成功！')
        handleLicenseActivated()
        navigate('/login')
      } else {
        setError('授權碼錯誤，請確認後重新輸入')
      }
    } catch (err) {
      console.error('激活錯誤:', err)
      setError(err.response?.data?.error || '激活失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '40px',
        maxWidth: '450px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '10px'
          }}>
            庫存管理系統
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            請輸入授權碼以啟動系統
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '20px',
            color: '#c00',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleActivate}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#333'
            }}>
              授權碼
            </label>
            <input
              type="password"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="請輸入授權碼"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '驗證中...' : '啟動系統'}
          </button>
        </form>

        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#666'
        }}>
          <strong>提示：</strong>授權碼為系統管理員提供，如未取得授權碼請聯繫供應商。
        </div>
      </div>
    </div>
  )
}