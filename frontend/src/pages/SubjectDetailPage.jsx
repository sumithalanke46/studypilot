import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Trash2,
  Edit,
  Bot,
  HelpCircle
} from 'lucide-react';
import { subjectsApi } from '../api/subjects';
import { useNotification } from '../contexts/NotificationContext';

export const SubjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useNotification();

  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add Topic Modal State
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [topicName, setTopicName] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [proficiency, setProficiency] = useState(2);
  const [estHours, setEstHours] = useState(2.5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubject = async () => {
    try {
      const data = await subjectsApi.getById(id);
      setSubject(data);
    } catch (err) {
      addToast('Failed to load subject details.', 'error');
      navigate('/subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubject();
  }, [id]);

  const handleToggleComplete = async (topicId) => {
    try {
      await subjectsApi.toggleTopicComplete(topicId);
      addToast('Topic completion status updated!', 'success');
      fetchSubject();
    } catch (err) {
      addToast('Failed to update topic status.', 'error');
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await subjectsApi.createTopic({
        subject_id: parseInt(id),
        name: topicName,
        description: topicDesc,
        difficulty: parseInt(difficulty),
        proficiency: parseInt(proficiency),
        estimated_hours: parseFloat(estHours)
      });
      addToast('Topic added successfully!', 'success');
      setShowAddTopicModal(false);
      setTopicName('');
      setTopicDesc('');
      fetchSubject();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to add topic.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTopic = async (topicId, topicName) => {
    if (!window.confirm(`Are you sure you want to delete "${topicName}"?`)) return;
    try {
      await subjectsApi.deleteTopic(topicId);
      addToast('Topic deleted.', 'info');
      fetchSubject();
    } catch (err) {
      addToast('Failed to delete topic.', 'error');
    }
  };

  const handleDeleteSubject = async () => {
    if (!window.confirm(`Are you sure you want to delete ${subject?.name}? This will remove all associated topics and sessions.`)) return;
    try {
      await subjectsApi.delete(id);
      addToast('Subject deleted.', 'info');
      navigate('/subjects');
    } catch (err) {
      addToast('Failed to delete subject.', 'error');
    }
  };

  if (loading || !subject) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
        <Sparkles size={32} className="spin" style={{ margin: '0 auto 1rem', color: 'var(--accent-primary)' }} />
        <p>Loading course details...</p>
      </div>
    );
  }

  const topics = subject.topics || [];
  const completedTopics = topics.filter(t => t.completed).length;
  const progressPct = topics.length > 0 ? Math.round((completedTopics / topics.length) * 100) : 0;

  return (
    <div>
      {/* Back button & Subject Title Header */}
      <button
        onClick={() => navigate('/subjects')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '1.25rem'
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to all subjects</span>
      </button>

      <div className="card" style={{ borderLeft: `6px solid ${subject.color || '#4F46E5'}`, marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF' }}>
              {subject.name}
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem', maxWidth: '700px' }}>
              {subject.description || 'No course syllabus description provided.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setShowAddTopicModal(true)}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Add Topic</span>
            </button>
            <button
              onClick={handleDeleteSubject}
              className="btn btn-danger"
              title="Delete Subject"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Readiness and topics progress bar */}
        <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              Subject Readiness: <strong style={{ color: '#FFFFFF' }}>{subject.readiness_percentage || 0}%</strong>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              {completedTopics} of {topics.length} topics completed ({progressPct}%)
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', background: subject.color || '#4F46E5', borderRadius: '4px', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      </div>

      {/* Topics List Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF' }}>
          Curriculum Topics ({topics.length})
        </h2>
      </div>

      {/* Topics List */}
      {topics.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', borderStyle: 'dashed' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            No topics added under this subject yet. Add topics to enable adaptive scheduling!
          </p>
          <button
            onClick={() => setShowAddTopicModal(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            <Plus size={15} />
            <span>Add First Topic</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {topics.map((topic) => (
            <div
              key={topic.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                opacity: topic.completed ? 0.75 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => handleToggleComplete(topic.id)}
                  title={topic.completed ? 'Mark incomplete' : 'Mark complete'}
                  style={{ color: topic.completed ? '#10B981' : 'var(--text-muted)' }}
                >
                  {topic.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: topic.completed ? 'var(--text-muted)' : '#FFFFFF',
                      textDecoration: topic.completed ? 'line-through' : 'none'
                    }}>
                      {topic.name}
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '600px' }}>
                    {topic.description || 'No description.'}
                  </p>
                </div>
              </div>

              {/* Badges & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={13} />
                  <span>{topic.completed_hours || 0}/{topic.estimated_hours}h</span>
                </span>

                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)'
                }}>
                  Diff: {topic.difficulty}/5
                </span>

                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: topic.proficiency <= 2 ? '#F87171' : 'var(--text-secondary)'
                }}>
                  Prof: {topic.proficiency}/5
                </span>

                <button
                  onClick={() => navigate(`/quizzes`)}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                  title="Take Topic Quiz"
                >
                  <HelpCircle size={14} />
                  <span>Quiz</span>
                </button>

                <button
                  onClick={() => navigate(`/ai-tutor`)}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#A5B4FC' }}
                  title="Ask AI Tutor about this topic"
                >
                  <Bot size={14} />
                  <span>Tutor</span>
                </button>

                <button
                  onClick={() => handleDeleteTopic(topic.id, topic.name)}
                  style={{ color: 'var(--text-muted)', padding: '0.3rem' }}
                  title="Delete Topic"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Topic Modal */}
      {showAddTopicModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '1.25rem' }}>
              Add Topic to {subject.name}
            </h2>

            <form onSubmit={handleCreateTopic}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Topic Name
                </label>
                <input
                  type="text"
                  required
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g. Deadlocks & Synchronization"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Description / Key Sub-concepts
                </label>
                <textarea
                  rows="2"
                  value={topicDesc}
                  onChange={(e) => setTopicDesc(e.target.value)}
                  placeholder="e.g. Coffman conditions, Banker's Algorithm, Mutex locks..."
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Difficulty ({difficulty}/5)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Proficiency ({proficiency}/5)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={proficiency}
                    onChange={(e) => setProficiency(e.target.value)}
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Est. Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50"
                    value={estHours}
                    onChange={(e) => setEstHours(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddTopicModal(false)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
