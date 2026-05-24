import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default {
  // Auth
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),

  // Dashboard
  getDashboardStats: () => api.get('/dashboard/stats'),
  getRecentSales: () => api.get('/dashboard/recent-sales'),

  // Customers
  getCustomers: () => api.get('/customers'),
  getCustomer: (id) => api.get(`/customers/${id}`),
  createCustomer: (data) => api.post('/customers', data),
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
  searchCustomers: (keyword) => api.get(`/customers/search/${keyword}`),

  // Products
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  updateProductStock: (id, data) => api.patch(`/products/${id}/stock`, data),
  getCategories: () => api.get('/products/meta/categories'),

  // Sales
  getSales: (params) => api.get('/sales', { params }),
  getSale: (id) => api.get(`/sales/${id}`),
  createSale: (data) => api.post('/sales', data),
  deleteSale: (id) => api.delete(`/sales/${id}`),
  getSalesReport: (params) => api.get('/sales/report/summary', { params }),

  // Purchases
  getPurchases: () => api.get('/purchases'),
  getPurchase: (id) => api.get(`/purchases/${id}`),
  createPurchase: (data) => api.post('/purchases', data),
  updatePurchaseStatus: (id, data) => api.patch(`/purchases/${id}/status`, data),
  deletePurchase: (id) => api.delete(`/purchases/${id}`),

  // Users
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  changePassword: (data) => api.patch('/users/change-password', data),

  // Logs
  getLogs: (params) => api.get('/logs', { params }),

  // Settings
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
  updateSetting: (key, data) => api.put(`/settings/${key}`, data),
}