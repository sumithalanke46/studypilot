import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Play,
  Sparkles,
  RefreshCw,
  ArrowRight,
  BookOpen,
  GraduationCap,
  TrendingUp
} from 'lucide-react';
import { analyticsApi } from '../api/analytics';
import { sessionsApi, studyPlanApi } from '../api/studyPlan';
import { subjectsApi } from '../api/subjects';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { FocusTimerModal } from '../components/study/FocusTimerModal';
import { MissedDayRecoveryModal } from '../components/study/MissedDayRecoveryModal';
import { GeneratePlanModal } from '../components/study/GeneratePlanModal';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [todaySessions, setTodaySessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [activeFocusSession, setActiveFocusSession] = useState(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [analyticsData, sessionsData, subjectsData] = await Promise.all([
        analyticsApi.getDashboard(),
        sessionsApi.list({ startDate: todayStr, endDate: todayStr }),
        subjectsApi.list()
      ]);
      setAnalytics(analyticsData);
      setTodaySessions(sessionsData);
      setSubjects(subjectsData);
    } catch (err) {
      console.error('Dashboard load error:', err);
      addToast('Error loading dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
        <Sparkles size={32} className="spin" style={{ margin: '0 auto 1rem', color: 'var(--accent-primary)' }} />
        <p>Loading your adaptive study dashboard...</p>
      </div>
    );
  }

  const streak = analytics?.streak || {};
  const readinessPct = analytics?.overall_readiness_percentage || 0;

  return (
    <div>
      {/* Top Banner & Quick Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Hello, {user?.name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Here is your adaptive roadmap and daily priorities for today.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowRecoveryModal(true)}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} />
            <span>Recover Schedule</span>
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            <Sparkles size={15} />
            <span>Generate Study Plan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {/* Study Streak */}
        <div className="card card-hover">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Study Streak
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
              <Flame size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF' }}>
            {streak.current_streak_days || 0} <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>days</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Longest streak: {streak.longest_streak_days || 0} days
          </div>
        </div>

        {/* Overall Exam Readiness */}
        <div className="card card-hover">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Exam Readiness
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: readinessPct >= 70 ? '#10B981' : (readinessPct >= 50 ? '#F59E0B' : '#EF4444') }}>
            {readinessPct}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Calculated across {analytics?.subject_readiness?.length || 0} enrolled subjects
          </div>
        </div>

        {/* Today's Focus Progress */}
        <div className="card card-hover">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Today's Focus
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF' }}>
            {analytics?.today_completed_minutes || 0} / {analytics?.today_planned_minutes || 0}{' '}
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>min</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Weekly studied: {analytics?.weekly_completed_hours || 0} hrs
          </div>
        </div>

        {/* Adherence & Completion Rate */}
        <div className="card card-hover">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Plan Adherence
            </span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF' }}>
            {streak.completion_rate_percentage || 100}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {streak.total_sessions_completed || 0} completed sessions logged
          </div>
        </div>
      </div>

      {/* Main Split: Today's Sessions & Insights */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        {/* Left 2 Cols: Today's Scheduled Sessions */}
        <div style={{ gridColumn: 'span 2' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} color="var(--accent-primary)" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Today's Study Schedule
                </h2>
              </div>
              <button
                onClick={() => navigate('/study-plan')}
                style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <span>Full Timetable</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {todaySessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                <Calendar size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.25rem' }}>
                  No study sessions scheduled for today
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Generate a personalized adaptive plan to schedule high-priority topics.
                </p>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  <Sparkles size={16} />
                  <span>Generate Today's Plan</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {todaySessions.map((session) => (
                  <div
                    key={session.id}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      transition: 'border-color var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        background: session.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                        color: session.status === 'completed' ? '#10B981' : '#818CF8',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {session.start_time} - {session.end_time}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: session.subject_color || '#818CF8',
                            textTransform: 'uppercase'
                          }}>
                            {session.subject_name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {session.duration_minutes} mins
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF' }}>
                          {session.topic_name}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {session.status === 'completed' ? (
                        <span className="badge badge-low" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <CheckCircle2 size={13} />
                          <span>Completed ({session.actual_duration_minutes}m)</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => setActiveFocusSession(session)}
                          className="btn btn-primary"
                          style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                        >
                          <Play size={14} />
                          <span>Start Focus</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Weak Topics Alert & Upcoming Exams */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Weak Topics Warning Callout */}
          <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertTriangle size={18} color="#F87171" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                High-Risk Weak Topics
              </h3>
            </div>

            {!analytics?.weak_topics || analytics.weak_topics.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No high-risk topics detected. Great progress!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {analytics.weak_topics.slice(0, 3).map((wt) => (
                  <div
                    key={wt.topic_id}
                    onClick={() => navigate(`/quizzes`)}
                    style={{
                      background: 'var(--bg-primary)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.72rem', color: wt.subject_color || '#A5B4FC', fontWeight: 700 }}>
                        {wt.subject_name}
                      </span>
                      <span className="badge badge-urgent" style={{ fontSize: '0.65rem' }}>
                        {wt.risk_level} RISK
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#FFFFFF' }}>
                      {wt.topic_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#F87171', marginTop: '0.2rem' }}>
                      ⚠️ {wt.primary_reason}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Exams Countdown */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Upcoming Exams
                </h3>
              </div>
              <button
                onClick={() => navigate('/exams')}
                style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}
              >
                Manage
              </button>
            </div>

            {!analytics?.upcoming_exams || analytics.upcoming_exams.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No exams added yet.{' '}
                <button
                  onClick={() => navigate('/exams')}
                  style={{ color: 'var(--accent-primary)', fontWeight: 600 }}
                >
                  Add your first exam
                </button>
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {analytics.upcoming_exams.slice(0, 3).map((exam) => (
                  <div
                    key={exam.exam_id}
                    style={{
                      background: 'var(--bg-primary)',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#FFFFFF' }}>
                        {exam.exam_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: exam.subject_color || 'var(--text-secondary)' }}>
                        {exam.subject_name} • Target {exam.target_score}%
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: exam.days_remaining <= 5 ? '#EF4444' : '#F59E0B',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {exam.days_remaining}d left
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {exam.projected_readiness}% ready
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Focus Timer Modal */}
      {activeFocusSession && (
        <FocusTimerModal
          session={activeFocusSession}
          onClose={() => setActiveFocusSession(null)}
          onSessionCompleted={fetchDashboardData}
        />
      )}

      {/* Missed Day Recovery Modal */}
      {showRecoveryModal && (
        <MissedDayRecoveryModal
          onClose={() => setShowRecoveryModal(false)}
          onRebuilt={fetchDashboardData}
        />
      )}

      {/* Generate Plan Modal */}
      {showGenerateModal && (
        <GeneratePlanModal
          subjects={subjects}
          onClose={() => setShowGenerateModal(false)}
          onGenerated={fetchDashboardData}
        />
      )}
    </div>
  );
};
