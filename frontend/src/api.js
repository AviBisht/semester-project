import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to attach JWT token for operators
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('operator_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to catch 401 and redirect if needed
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on operator routes, clear token
      const path = window.location.pathname;
      if (path.startsWith('/operator') && path !== '/operator/login') {
        localStorage.removeItem('operator_token');
        localStorage.removeItem('operator_user');
        window.location.href = '/operator/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
