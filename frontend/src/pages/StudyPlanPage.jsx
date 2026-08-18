import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertCircle,
  Plus,
  BookOpen,
  ChevronRight
} from 'lucide-react';
import { studyPlanApi, sessionsApi } from '../api/studyPlan';
import { subjectsApi } from '../api/subjects';
import { useNotification } from '../contexts/NotificationContext';
import { FocusTimerModal } from '../components/study/FocusTimerModal';
import { MissedDayRecoveryModal } from '../components/study/MissedDayRecoveryModal';
import { GeneratePlanModal } from '../components/study/GeneratePlanModal';

export const StudyPlanPage = () => {
  const { addToast } = useNotification();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [activeFocusSession, setActiveFocusSession] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  const fetchPlanData = async () => {
    try {
      const [planData, subjectsData] = await Promise.all([
        studyPlanApi.getCurrent(),
        subjectsApi.list()
      ]);
      setCurrentPlan(planData);
      setSubjects(subjectsData);
    } catch (err) {
      addToast('Failed to load study plan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanData();
  }, []);

  // Group sessions by scheduled date
  const groupedSessions = {};
  if (currentPlan && currentPlan.sessions) {
    currentPlan.sessions.forEach((s) => {
      const dateKey = s.scheduled_date;
      if (!groupedSessions[dateKey]) {
        groupedSessions[dateKey] = [];
      }
      groupedSessions[dateKey].push(s);
    });
  }

  const sortedDates = Object.keys(groupedSessions).sort();

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF' }}>
            Adaptive Study Timetable
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Personalized slot allocations with spaced repetition and cognitive subject interleaving.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowRecoveryModal(true)}
            className="btn btn-secondary"
          >
            <RefreshCw size={16} />
            <span>Recover Missed Days</span>
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn btn-primary"
          >
            <Sparkles size={16} />
            <span>Generate Fresh Plan</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <Sparkles size={32} className="spin" style={{ margin: '0 auto 1rem', color: 'var(--accent-primary)' }} />
          <p>Loading schedule...</p>
        </div>
      ) : !currentPlan || sortedDates.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem', borderStyle: 'dashed' }}>
          <Clock size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>
            No active study plan generated
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            The StudyPilot deterministic scheduling engine will analyze your course topics, exam urgency, and proficiency to build an optimal timetable.
          </p>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn btn-primary"
          >
            <Sparkles size={16} />
            <span>Generate Adaptive Plan</span>
          </button>
        </div>
      ) : (
        <div>
          {/* Plan Meta Banner */}
          <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(17, 24, 39, 0.8) 100%)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="badge badge-low" style={{ marginBottom: '0.4rem' }}>Active Plan</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {new Date(currentPlan.plan_start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} -{' '}
                  {new Date(currentPlan.plan_end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Total Sessions
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF' }}>
                    {currentPlan.total_sessions}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Total Target Workload
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {currentPlan.total_hours} hrs
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grouped Day Schedule Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {sortedDates.map((dateStr) => {
              const dayDate = new Date(dateStr);
              const dayName = dayDate.toLocaleDateString(undefined, { weekday: 'long' });
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const daySessions = groupedSessions[dateStr];

              return (
                <div
                  key={dateStr}
                  className="card"
                  style={{
                    borderLeft: isToday ? '4px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: isToday ? 'rgba(31, 41, 55, 0.95)' : 'var(--bg-card)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                        {dayName}, {dayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </h3>
                      {isToday && (
                        <span className="badge badge-high" style={{ fontSize: '0.68rem' }}>
                          Today's Roadmap
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {daySessions.length} session{daySessions.length === 1 ? '' : 's'} (
                      {daySessions.reduce((acc, s) => acc + s.duration_minutes, 0)} mins)
                    </span>
                  </div>

                  {/* Sessions in day */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {daySessions.map((session) => (
                      <div
                        key={session.id}
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '0.85rem 1.1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            padding: '0.4rem 0.65rem',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.05)',
                            color: '#E5E7EB',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            {session.start_time} - {session.end_time}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: session.subject_color || '#818CF8', textTransform: 'uppercase' }}>
                                {session.subject_name}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>•</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {session.duration_minutes}m
                              </span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#FFFFFF' }}>
                              {session.topic_name}
                            </div>
                          </div>
                        </div>

                        <div>
                          {session.status === 'completed' ? (
                            <span className="badge badge-low">
                              <CheckCircle2 size={13} />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => setActiveFocusSession(session)}
                              className="btn btn-primary"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                            >
                              <Play size={13} />
                              <span>Focus Mode</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Focus Timer Modal */}
      {activeFocusSession && (
        <FocusTimerModal
          session={activeFocusSession}
          onClose={() => setActiveFocusSession(null)}
          onSessionCompleted={fetchPlanData}
        />
      )}

      {/* Missed Day Recovery Modal */}
      {showRecoveryModal && (
        <MissedDayRecoveryModal
          onClose={() => setShowRecoveryModal(false)}
          onRebuilt={fetchPlanData}
        />
      )}

      {/* Generate Plan Modal */}
      {showGenerateModal && (
        <GeneratePlanModal
          subjects={subjects}
          onClose={() => setShowGenerateModal(false)}
          onGenerated={fetchPlanData}
        />
      )}
    </div>
  );
};
