import { useState, useEffect } from 'react'
import api from '../api'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'user' })
  const [error, setError] = useState('')

  const loadUsers = () => { api.getUsers().then(res => setUsers(res.data)).finally(() => setLoading(false)) }
  useEffect(() => { loadUsers() }, [])

  const openCreate = () => { setEditData(null); setForm({ username: '', password: '', name: '', role: 'user' }); setError(''); setShowModal(true) }
  const openEdit = (u) => { setEditData(u); setForm({ username: u.username, password: '', name: u.name, role: u.role }); setError(''); setShowModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editData) {
        const data = { name: form.name, role: form.role }
        if (form.password) data.password = form.password
        await api.updateUser(editData.id, data)
      } else {
        if (!form.password) { setError('密碼為必填'); return }
        await api.createUser(form)
      }
      setShowModal(false)
      loadUsers()
    } catch (err) { setError(err.response?.data?.error || '儲存失敗') }
  }

  const handleDelete = async (id) => {
    if (!confirm('確定要刪除嗎？')) return
    await api.deleteUser(id)
    loadUsers()
  }

  if (loading) return <div className="loading">載入中...</div>

  return (
    <div>
      <div className="page-header">
        <h1>使用者管理</h1>
        <button className="btn btn-primary" onClick={openCreate}>新增使用者</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>帳號</th><th>姓名</th><th>角色</th><th>建立時間</th><th>操作</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.name}</td>
                  <td><span className={`badge ${u.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>{u.role}</span></td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="actions">
                    {u.username !== 'admin' && (
                      <>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>編輯</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>刪除</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editData ? '編輯使用者' : '新增使用者'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>帳號 {editData && '(不需填寫)'}</label><input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required={!editData} disabled={!!editData} /></div>
              <div className="form-group"><label>{editData ? '新密碼 (不變更請留空)' : '密碼'}</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editData} /></div>
              <div className="form-group"><label>姓名</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="form-group"><label>角色</label><select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="user">一般使用者</option><option value="admin">管理者</option></select></div>
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