import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Sparkles, Clock, AlertTriangle, CheckCircle2, Trash2, Edit2 } from 'lucide-react';
import { examsApi } from '../api/exams';
import { subjectsApi } from '../api/subjects';
import { useNotification } from '../contexts/NotificationContext';

export const ExamsPage = () => {
  const { addToast } = useNotification();
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Exam Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [priority, setPriority] = useState('high');
  const [targetScore, setTargetScore] = useState(90);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExamsAndSubjects = async () => {
    try {
      const [examsData, subjectsData] = await Promise.all([
        examsApi.list(),
        subjectsApi.list()
      ]);
      setExams(examsData);
      setSubjects(subjectsData);
      if (subjectsData.length > 0 && !subjectId) {
        setSubjectId(subjectsData[0].id.toString());
      }
    } catch (err) {
      addToast('Failed to load exams.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamsAndSubjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!subjectId) {
      addToast('Please select a subject first.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await examsApi.create({
        subject_id: parseInt(subjectId),
        exam_name: examName,
        exam_date: examDate,
        priority: priority,
        target_score: parseFloat(targetScore)
      });
      addToast('Exam created successfully!', 'success');
      setShowAddModal(false);
      setExamName('');
      setExamDate('');
      fetchExamsAndSubjects();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to add exam.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await examsApi.delete(id);
      addToast('Exam deleted.', 'info');
      fetchExamsAndSubjects();
    } catch (err) {
      addToast('Failed to delete exam.', 'error');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF' }}>
            Exams & Target Deadlines
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Real-time urgency weighting, countdowns, and projected readiness scores.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>Add New Exam</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <Sparkles size={32} className="spin" style={{ margin: '0 auto 1rem', color: 'var(--accent-primary)' }} />
          <p>Loading upcoming exams...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem', borderStyle: 'dashed' }}>
          <Calendar size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>
            No exams scheduled
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Add your upcoming midterms or final exams so the scheduler prioritizes urgent topics.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Add Upcoming Exam</span>
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {exams.map((exam) => {
            const daysLeft = exam.days_remaining;
            const readiness = Math.round(exam.readiness_percentage || 0);

            return (
              <div
                key={exam.id}
                className="card card-hover"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `4px solid ${exam.subject_color || '#4F46E5'}`
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: exam.subject_color || 'var(--accent-primary)',
                      textTransform: 'uppercase'
                    }}>
                      {exam.subject_name}
                    </span>

                    <span className={`badge badge-${exam.priority || 'medium'}`}>
                      {exam.priority}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                    {exam.exam_name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    <Calendar size={15} />
                    <span>{new Date(exam.exam_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  {/* Countdown Box */}
                  <div style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '8px',
                    padding: '0.85rem',
                    border: '1px solid var(--border-color)',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Time Remaining
                      </div>
                      <div style={{
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        color: daysLeft <= 5 ? '#EF4444' : (daysLeft <= 10 ? '#F59E0B' : '#10B981')
                      }}>
                        {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Projected Readiness
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: readiness >= 70 ? '#10B981' : '#F59E0B' }}>
                        {readiness}%
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Target Score: <strong>{exam.target_score}%</strong>
                  </span>
                  <button
                    onClick={() => handleDelete(exam.id, exam.exam_name)}
                    style={{ color: 'var(--text-muted)', padding: '0.2rem' }}
                    title="Delete Exam"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Exam Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '1.25rem' }}>
              Add Upcoming Exam
            </h2>

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Subject Course
                </label>
                <select
                  required
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Exam Name
                </label>
                <input
                  type="text"
                  required
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="e.g. OS Midterm Examination"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Exam Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
              </div>

              <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="urgent">Urgent (Highest focus)</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Target Score ({targetScore}%)
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={targetScore}
                    onChange={(e) => setTargetScore(e.target.value)}
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
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
                  {isSubmitting ? 'Scheduling...' : 'Add Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
