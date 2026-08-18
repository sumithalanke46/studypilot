import apiClient from './client';

export const notificationsApi = {
  list: async () => {
    const res = await apiClient.get('/notifications');
    return res.data;
  },
  markRead: async (id) => {
    const res = await apiClient.post(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await apiClient.post('/notifications/read-all');
    return res.data;
  }
};
