import apiClient from './client';

export const studyPlanApi = {
  getCurrent: async () => {
    const res = await apiClient.get('/study-plan/current');
    return res.data;
  },
  generate: async (params = {}) => {
    const res = await apiClient.post('/study-plan/generate', params);
    return res.data;
  },
  rebuild: async (missedDays, reason = '') => {
    const res = await apiClient.post('/study-plan/rebuild', {
      missed_days: missedDays,
      reason: reason
    });
    return res.data;
  }
};

export const sessionsApi = {
  list: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.status) params.append('status', filters.status);

    const res = await apiClient.get(`/sessions?${params.toString()}`);
    return res.data;
  },
  complete: async (id, actualMinutes, notes = '', proficiency = null) => {
    const payload = {
      actual_duration_minutes: actualMinutes,
      notes: notes
    };
    if (proficiency) {
      payload.update_topic_proficiency = proficiency;
    }
    const res = await apiClient.post(`/sessions/${id}/complete`, payload);
    return res.data;
  },
  skip: async (id, reason = '') => {
    const res = await apiClient.post(`/sessions/${id}/skip?reason=${encodeURIComponent(reason)}`);
    return res.data;
  }
};
