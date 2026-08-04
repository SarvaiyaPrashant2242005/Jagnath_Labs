import api from './api';

const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data && response.data.success) {
      const data = response.data.data;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('role', data.user.role || 'user');
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      localStorage.clear();
      window.location.hash = '#/login';
    }
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  getRole: () => {
    return localStorage.getItem('role');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export default authService;
