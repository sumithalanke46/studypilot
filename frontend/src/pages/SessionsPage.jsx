import React, { useState, useEffect } from 'react';
import { GraduationCap, Play, CheckCircle2, Clock, Calendar, Filter, Sparkles, AlertCircle } from 'lucide-react';
import { sessionsApi } from '../api/studyPlan';
import { useNotification } from '../contexts/NotificationContext';
import { FocusTimerModal } from '../components/study/FocusTimerModal';

export const SessionsPage = () => {
  const { addToast } = useNotification();
  const [sessions, setSessions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeFocusSession, setActiveFocusSession] = useState(null);

  const fetchSessions = async () => {
    try {
      const data = await sessionsApi.list({ status: statusFilter || undefined });
      setSessions(data);
    } catch (err) {
      addToast('Failed to load study sessions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [statusFilter]);

  const handleSkip = async (id) => {
    try {
      await sessionsApi.skip(id, 'User manually skipped');
      addToast('Session marked as skipped.', 'info');
      fetchSessions();
    } catch (err) {
      addToast('Failed to skip session.', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <span className="badge badge-low">Completed</span>;
      case 'missed': return <span className="badge badge-urgent">Missed</span>;
      case 'skipped': return <span className="badge badge-medium">Skipped</span>;
      default: return <span className="badge badge-high">Scheduled</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF' }}>
            Study Sessions & Log
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Track your focused study blocks, actual durations, reflections, and completion records.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-card)', padding: '0.3rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {['', 'scheduled', 'completed', 'missed', 'skipped'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                background: statusFilter === st ? 'var(--accent-primary)' : 'transparent',
                color: statusFilter === st ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'capitalize'
              }}
            >
              {st === '' ? 'All Sessions' : st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <Sparkles size={32} className="spin" style={{ margin: '0 auto 1rem', color: 'var(--accent-primary)' }} />
          <p>Loading session logs...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem', borderStyle: 'dashed' }}>
          <GraduationCap size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>
            No sessions match your filter
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Generate a study plan from the dashboard to start logging study sessions.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sessions.map((session) => (
            <div
              key={session.id}
              className="card"
              style={{
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                borderLeft: `4px solid ${session.subject_color || '#4F46E5'}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: session.subject_color || '#818CF8', textTransform: 'uppercase' }}>
                      {session.subject_name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(session.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.2rem' }}>
                    {session.topic_name}
                  </h3>
                  {session.notes && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      "{session.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Right Details & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                    {session.start_time} - {session.end_time}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Planned: {session.duration_minutes}m {session.actual_duration_minutes > 0 && `(Done: ${session.actual_duration_minutes}m)`}
                  </div>
                </div>

                {getStatusBadge(session.status)}

                {session.status === 'scheduled' && (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => setActiveFocusSession(session)}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      <Play size={14} />
                      <span>Start</span>
                    </button>
                    <button
                      onClick={() => handleSkip(session.id)}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                      title="Skip this session"
                    >
                      Skip
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeFocusSession && (
        <FocusTimerModal
          session={activeFocusSession}
          onClose={() => setActiveFocusSession(null)}
          onSessionCompleted={fetchSessions}
        />
      )}
    </div>
  );
};
