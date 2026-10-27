import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

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

// --- Alert & Subscription API Endpoints ---
export const subscribeToAlerts = (data) => api.post('/api/alerts/subscribe', data);
export const getSubscription = (token) => api.get(`/api/alerts/subscriptions/${token}`);
export const updateSubscription = (token, data) => api.patch(`/api/alerts/subscriptions/${token}`, data);
export const unsubscribeAlerts = (token) => api.delete(`/api/alerts/subscriptions/${token}`);
export const getSubscriberAlerts = (token) => api.get(`/api/alerts/subscriber/${token}`);
export const markAlertRead = (token, dispatchId) => api.post(`/api/alerts/subscriber/${token}/read/${dispatchId}`);
export const getActivePublicAlerts = () => api.get('/api/alerts/active');
export const approveIncidentAndBroadcast = (incidentId, data) => api.post(`/api/incidents/${incidentId}/approve`, data);

export default api;
export { API_BASE_URL };
