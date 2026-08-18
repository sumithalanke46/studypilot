import apiClient from './client';

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
