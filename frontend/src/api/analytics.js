import apiClient from './client';

export const analyticsApi = {
  getDashboard: async () => {
    const res = await apiClient.get('/analytics/dashboard');
    return res.data;
  },
  getWeakTopics: async () => {
    const res = await apiClient.get('/analytics/weak-topics');
    return res.data;
  },
  getReadiness: async () => {
    const res = await apiClient.get('/analytics/readiness');
    return res.data;
  }
};
