import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Play, Sparkles, CheckCircle2, History, Award } from 'lucide-react';
import { subjectsApi } from '../api/subjects';
import { quizzesApi } from '../api/quizzes';
import { useNotification } from '../contexts/NotificationContext';

export const QuizzesPage = () => {
  const navigate = useNavigate();
  const { addToast } = useNotification();

  const [subjects, setSubjects] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subData, histData] = await Promise.all([
          subjectsApi.list(),
          quizzesApi.getHistory()
        ]);
        setSubjects(subData);
        setHistory(histData);
        if (subData.length > 0) {
          setSelectedSubjectId(subData[0].id.toString());
          if (subData[0].topics && subData[0].topics.length > 0) {
            setSelectedTopicId(subData[0].topics[0].id.toString());
          }
        }
      } catch (err) {
        addToast('Failed to load quiz data.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubjectChange = (e) => {
    const sId = e.target.value;
    setSelectedSubjectId(sId);
    const sub = subjects.find(s => s.id === parseInt(sId));
    if (sub && sub.topics && sub.topics.length > 0) {
      setSelectedTopicId(sub.topics[0].id.toString());
    } else {
      setSelectedTopicId('');
    }
  };

  const startQuiz = () => {
    if (!selectedTopicId || !selectedSubjectId) {
      addToast('Please select a subject and topic to test.', 'error');
      return;
    }
    navigate(`/quizzes/take?topic_id=${selectedTopicId}&subject_id=${selectedSubjectId}`);
  };

  const selectedSubject = subjects.find(s => s.id === parseInt(selectedSubjectId));

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF' }}>
          Diagnostic Topic Quizzes
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          Test your engineering recall. Quiz scores automatically recalibrate topic risk and scheduler priority weights.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <Sparkles size={32} className="spin" style={{ margin: '0 auto 1rem', color: 'var(--accent-primary)' }} />
          <p>Loading quiz system...</p>
        </div>
      ) : (
        <div className="grid-3" style={{ alignItems: 'start' }}>
          {/* Left Column: Quiz Launch Card */}
          <div className="card" style={{ gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <HelpCircle size={20} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
                Launch New Quiz
              </h2>
            </div>

            {subjects.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Please add courses and topics first before taking quizzes.
              </p>
            ) : (
              <div>
                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Select Subject
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={handleSubjectChange}
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Select Topic
                  </label>
                  {selectedSubject && selectedSubject.topics && selectedSubject.topics.length > 0 ? (
                    <select
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                    >
                      {selectedSubject.topics.map((top) => (
                        <option key={top.id} value={top.id}>
                          {top.name} (Proficiency: {top.proficiency}/5)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      No topics available under this subject.
                    </p>
                  )}
                </div>

                <button
                  onClick={startQuiz}
                  disabled={!selectedTopicId}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.8rem' }}
                >
                  <Play size={16} />
                  <span>Start 5-Question Quiz</span>
                </button>
              </div>
            )}
          </div>

          {/* Right 2 Columns: Past Quiz Score History */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={20} color="var(--accent-primary)" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Past Quiz Results & Scorecard
                </h2>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {history.length} completed
              </span>
            </div>

            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <Award size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ fontSize: '0.9rem' }}>No quizzes taken yet. Launch your first diagnostic quiz on the left!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
                {history.map((h) => {
                  const pct = Math.round(h.percentage);
                  return (
                    <div
                      key={h.id}
                      style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '8px',
                        padding: '0.85rem 1rem',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                          {h.subject_name} • {new Date(h.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', marginTop: '0.15rem' }}>
                          {h.topic_name}
                        </h4>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: '1.2rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            color: pct >= 80 ? '#10B981' : (pct >= 60 ? '#F59E0B' : '#EF4444')
                          }}>
                            {pct}%
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {h.score} / {h.total_questions} correct
                          </div>
                        </div>

                        <span className={`badge badge-${pct >= 80 ? 'low' : (pct >= 60 ? 'medium' : 'urgent')}`} style={{ fontSize: '0.65rem' }}>
                          {pct >= 80 ? 'Mastered' : (pct >= 60 ? 'Review' : 'Weak Area')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
