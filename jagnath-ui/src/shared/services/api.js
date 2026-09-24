import axios from 'axios';
import { API_BASE_URL } from './apiEndpoints';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token and selected company context
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("accessToken") ||
                  localStorage.getItem("accessToken") ||
                  localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const companyId = localStorage.getItem('selectedCompanyId');
    if (companyId && companyId !== 'undefined' && companyId !== 'null') {
      config.headers['x-company-id'] = companyId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication failures and global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      // Redirect to login if token is expired or unauthorized
      if (status === 401) {
        localStorage.clear();
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
