import axios from 'axios';
// API base URL - set REACT_APP_API_URL env var to override for Docker/production
const BASE = process.env.REACT_APP_API_URL || '/api';
const api  = axios.create({ baseURL: BASE });

// Add a request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const authApi = {
  login:          (data) => api.post('/auth/login', data),
  register:       (data) => api.post('/auth/register', data),
  me:             ()     => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  externalLogin:  (data) => api.post('/auth/external-login', data),
};

export const categoriesApi = {
  list:   ()     => api.get('/categories/'),
  create: (data) => api.post('/categories/', data),
};
export const productsApi = {
  list:        (params) => api.get('/products/', { params }),
  get:         (id)     => api.get(`/products/${id}`),
  create:      (data)   => api.post('/products/', data),
  update:      (id, d)  => api.put(`/products/${id}`, d),
  delete:      (id)     => api.delete(`/products/${id}`),
  adjustStock: (id, d)  => api.post(`/products/${id}/stock`, d),
  logs:        (id)     => api.get(`/products/${id}/logs`),
};
export const customersApi = {
  list:   (params) => api.get('/customers/', { params }),
  get:    (id)     => api.get(`/customers/${id}`),
  create: (data)   => api.post('/customers/', data),
  update: (id, d)  => api.put(`/customers/${id}`, d),
  delete: (id)     => api.delete(`/customers/${id}`),
  orders: (id)     => api.get(`/customers/${id}/orders`),
};
export const ordersApi = {
  list:         (params) => api.get('/orders/', { params }),
  get:          (id)     => api.get(`/orders/${id}`),
  create:       (data)   => api.post('/orders/', data),
  updateStatus: (id, d)  => api.patch(`/orders/${id}/status`, d),
};
export const invoicesApi = {
  list:          (params) => api.get('/invoices/', { params }),
  get:           (id)     => api.get(`/invoices/${id}`),
  recordPayment: (id, d)  => api.post(`/invoices/${id}/payment`, d),
};
export const suppliersApi = {
  list:   ()     => api.get('/suppliers/'),
  get:    (id)   => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers/', data),
  update: (id,d) => api.put(`/suppliers/${id}`, d),
  delete: (id)   => api.delete(`/suppliers/${id}`),
};
export const purchaseOrdersApi = {
  list:         (params) => api.get('/purchase-orders/', { params }),
  get:          (id)     => api.get(`/purchase-orders/${id}`),
  create:       (data)   => api.post('/purchase-orders/', data),
  updateStatus: (id, d)  => api.patch(`/purchase-orders/${id}/status`, d),
  delete:       (id)     => api.delete(`/purchase-orders/${id}`),
};
export const analyticsApi = {
  get:       () => api.get('/analytics'),
  dashboard: () => api.get('/dashboard'),
};
export const usersApi = {
  list:         ()      => api.get('/users/'),
  create:       (data)  => api.post('/users/', data),
  update:       (id, d) => api.put(`/users/${id}`, d),
  updateStatus: (id, d) => api.patch(`/users/${id}/status`, d),
};

export default api;

