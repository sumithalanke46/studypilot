import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { studyPlanApi } from '../../api/studyPlan';
import { useNotification } from '../../contexts/NotificationContext';

export const MissedDayRecoveryModal = ({ onClose, onRebuilt }) => {
  const { addToast } = useNotification();
  const [missedDays, setMissedDays] = useState(2);
  const [reason, setReason] = useState('College festival / sickness');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);

  const handleRebuild = async () => {
    setIsSubmitting(true);
    try {
      const res = await studyPlanApi.rebuild(missedDays, reason);
      setResultSummary(res);
      addToast(res.message || 'Schedule successfully recalculated!', 'success');
      if (onRebuilt) onRebuilt();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to recalculate schedule.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <RefreshCw size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
              Recover My Schedule
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Missed a few study days? Let the adaptive engine recalibrate your roadmap.
            </p>
          </div>
        </div>

        {!resultSummary ? (
          <div>
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              color: '#FDE68A',
              lineHeight: 1.5
            }}>
              💡 <strong>How it works:</strong> StudyPilot does not naively shove missed sessions forward. It recalculates the required study velocity, increases priority weights on fallen-behind topics, and dynamically generates an optimal schedule starting from today.
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  How many study days were missed?
                </label>
                <span style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: '0.95rem' }}>
                  {missedDays} {missedDays === 1 ? 'day' : 'days'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="14"
                value={missedDays}
                onChange={(e) => setMissedDays(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Reason (optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Midterm project submission, sick leave, travel..."
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRebuild}
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                <RefreshCw size={16} className={isSubmitting ? 'spin' : ''} />
                <span>{isSubmitting ? 'Recalculating...' : 'Rebuild Schedule Now'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                Plan Recalculated Successfully!
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Your study velocity has been re-balanced without deleting your historical achievements.
              </p>

              <div className="grid-2" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Overdue Logged
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F87171' }}>
                    {resultSummary.overdue_sessions_marked_missed} sessions
                  </div>
                </div>
                <div style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    New Sessions Scheduled
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981' }}>
                    {resultSummary.new_sessions_scheduled} sessions
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                View Updated Schedule
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
