import axios, { type InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // SSR-safe: localStorage only available in browser
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const currentOrgId = localStorage.getItem('currentOrgId');
    if (currentOrgId) {
      config.headers['x-organization-id'] = currentOrgId;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if refresh request itself fails with 401
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post('/auth/refresh');
        const { token } = response.data;

        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }

        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;

        processQueue(null, token);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // If it's a 401 but we couldn't refresh (e.g. refresh failed, or refresh URL failed), logout
    if (
      error.response?.status === 401 &&
      originalRequest?.url?.includes('/auth/refresh') &&
      typeof window !== 'undefined'
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export default api;
