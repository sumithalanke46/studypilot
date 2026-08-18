import apiClient from './client';

export const authApi = {
  register: async (userData) => {
    const res = await apiClient.post('/auth/register', userData);
    return res.data;
  },
  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  updatePreferences: async (preferences) => {
    const res = await apiClient.put('/auth/preferences', preferences);
    return res.data;
  }
};
