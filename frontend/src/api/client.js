import axios from 'axios';

// Smart Base URL resolution with automatic fallback and sanitation
let rawUrl = (import.meta.env.VITE_API_URL || '').trim();
if (!rawUrl || rawUrl.includes('dashboard.render.com') || rawUrl.includes('localhost')) {
  rawUrl = 'https://studypilot-backend-e6e7.onrender.com/api/v1';
}
if (!rawUrl.endsWith('/api/v1') && !rawUrl.endsWith('/api/v1/')) {
  rawUrl = rawUrl.replace(/\/+$/, '') + '/api/v1';
}
const API_BASE_URL = rawUrl;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('studypilot_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRoute = window.location.pathname.includes('/login') || window.location.pathname.includes('/register');
      if (!isAuthRoute) {
        localStorage.removeItem('studypilot_token');
        localStorage.removeItem('studypilot_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
