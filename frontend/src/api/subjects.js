import apiClient from './client';

export const subjectsApi = {
  list: async () => {
    const res = await apiClient.get('/subjects');
    return res.data;
  },
  getById: async (id) => {
    const res = await apiClient.get(`/subjects/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await apiClient.post('/subjects', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await apiClient.put(`/subjects/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await apiClient.delete(`/subjects/${id}`);
    return res.data;
  },
  
  // Topic methods
  createTopic: async (data) => {
    const res = await apiClient.post('/topics', data);
    return res.data;
  },
  updateTopic: async (id, data) => {
    const res = await apiClient.put(`/topics/${id}`, data);
    return res.data;
  },
  toggleTopicComplete: async (id) => {
    const res = await apiClient.post(`/topics/${id}/toggle-complete`);
    return res.data;
  },
  deleteTopic: async (id) => {
    const res = await apiClient.delete(`/topics/${id}`);
    return res.data;
  }
};
