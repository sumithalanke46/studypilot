import apiClient from './client';

export const examsApi = {
  list: async () => {
    const res = await apiClient.get('/exams');
    return res.data;
  },
  create: async (data) => {
    const res = await apiClient.post('/exams', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await apiClient.put(`/exams/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await apiClient.delete(`/exams/${id}`);
    return res.data;
  }
};
