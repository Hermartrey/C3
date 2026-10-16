import axios from 'axios';

export const normalizeApiUrl = (url) => {
  if (!url || !url.trim()) return '';
  let cleaned = url.trim().replace(/\/+$/, '');
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  if (!cleaned.endsWith('/api')) {
    cleaned = `${cleaned}/api`;
  }
  return cleaned;
};

export const getApiBaseUrl = () => {
  const custom = typeof window !== 'undefined' ? localStorage.getItem('c3_custom_api_url') : null;
  if (custom && custom.trim()) {
    return normalizeApiUrl(custom);
  }
  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  return normalizeApiUrl(rawApiUrl);
};

export const setApiBaseUrl = (url) => {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('c3_custom_api_url');
    } else {
      localStorage.setItem('c3_custom_api_url', url.trim().replace(/\/+$/, ''));
    }
  }
  api.defaults.baseURL = getApiBaseUrl();
};

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const currentBase = getApiBaseUrl();
          const res = await axios.post(`${currentBase}/token/refresh/`, {
            refresh: refreshToken,
          });
          localStorage.setItem('access_token', res.data.access);
          api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

