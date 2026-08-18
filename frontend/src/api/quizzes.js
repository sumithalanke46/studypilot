import apiClient from './client';

export const quizzesApi = {
  getTopicQuiz: async (topicId, subjectId, count = 5) => {
    const res = await apiClient.get(`/quizzes/topic/${topicId}?subject_id=${subjectId}&count=${count}`);
    return res.data;
  },
  submit: async (subjectId, topicId, answers) => {
    const res = await apiClient.post('/quizzes/submit', {
      subject_id: subjectId,
      topic_id: topicId,
      answers: answers
    });
    return res.data;
  },
  getHistory: async () => {
    const res = await apiClient.get('/quizzes/history');
    return res.data;
  }
};

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

export const aiTutorApi = {
  chat: async (query, subjectId = null, topicId = null, actionType = 'explain') => {
    const res = await apiClient.post('/ai-tutor/chat', {
      query,
      subject_id: subjectId,
      topic_id: topicId,
      action_type: actionType
    });
    return res.data;
  }
};

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
