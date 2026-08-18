import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Sparkles, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { subjectsApi } from '../api/subjects';
import { useNotification } from '../contexts/NotificationContext';

export const SubjectsPage = () => {
  const navigate = useNavigate();
  const { addToast } = useNotification();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [proficiency, setProficiency] = useState(3);
  const [color, setColor] = useState('#4F46E5');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubjects = async () => {
    try {
      const data = await subjectsApi.list();
      setSubjects(data);
    } catch (err) {
      addToast('Failed to load subjects.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await subjectsApi.create({
        name,
        description,
        difficulty: parseInt(difficulty),
        proficiency: parseInt(proficiency),
        color
      });
      addToast('Subject added successfully!', 'success');
      setShowAddModal(false);
      setName('');
      setDescription('');
      fetchSubjects();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to create subject.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetColors = ['#4F46E5', '#0891B2', '#EA580C', '#10B981', '#8B5CF6', '#EC4899'];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF' }}>
            Subjects & Curriculum
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Manage your courses, modular topics, difficulties, and proficiency ratings.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>Add New Subject</span>
        </button>
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <Sparkles size={32} className="spin" style={{ margin: '0 auto 1rem', color: 'var(--accent-primary)' }} />
          <p>Loading your courses...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem', borderStyle: 'dashed' }}>
          <BookOpen size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>
            No subjects found
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Add your engineering courses (e.g. Operating Systems, DBMS, Algorithms) to start building an adaptive roadmap.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Add Your First Subject</span>
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {subjects.map((sub) => {
            const readiness = sub.readiness_percentage || 0;
            const completedCount = sub.completed_topics_count || 0;
            const totalCount = sub.topics_count || (sub.topics ? sub.topics.length : 0);
            const compRatio = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <div
                key={sub.id}
                onClick={() => navigate(`/subjects/${sub.id}`)}
                className="card card-hover"
                style={{
                  cursor: 'pointer',
                  borderTop: `4px solid ${sub.color || '#4F46E5'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
                      {sub.name}
                    </h3>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: readiness >= 70 ? '#10B981' : (readiness >= 45 ? '#F59E0B' : '#EF4444')
                    }}>
                      {readiness}% Ready
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.4, minHeight: '2.4rem' }}>
                    {sub.description || 'No description provided.'}
                  </p>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      <span>Topic Completion</span>
                      <span>{completedCount} of {totalCount} topics ({compRatio}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${compRatio}%`,
                          height: '100%',
                          background: sub.color || '#4F46E5',
                          borderRadius: '3px',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>

                  {/* Badges metadata */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)'
                    }}>
                      Difficulty: Level {sub.difficulty}/5
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
                      Proficiency: Level {sub.proficiency}/5
                    </span>
                  </div>
                </div>

                <div style={{
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.82rem',
                  color: 'var(--accent-primary)',
                  fontWeight: 600
                }}>
                  <span>Manage Topics & Content</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '1.25rem' }}>
              Add New Subject
            </h2>

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Operating Systems"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Description / Syllabus
                </label>
                <textarea
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Processes, Deadlocks, Memory Paging, File Systems..."
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="grid-2" style={{ marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Course Difficulty ({difficulty}/5)
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
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Current Proficiency ({proficiency}/5)
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
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Subject Color Accent
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {presetColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: c,
                        border: color === c ? '3px solid #FFFFFF' : '2px solid transparent',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  {isSubmitting ? 'Adding...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
