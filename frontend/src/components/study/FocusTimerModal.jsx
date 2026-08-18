import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, CheckCircle, Clock, BookOpen, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sessionsApi } from '../../api/studyPlan';
import { useNotification } from '../../contexts/NotificationContext';

export const FocusTimerModal = ({ session, onClose, onSessionCompleted }) => {
  const { addToast } = useNotification();
  const initialSeconds = (session.duration_minutes || 45) * 60;
  
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [proficiency, setProficiency] = useState(session.topic_proficiency || 3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((sec) => sec - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsActive(false);
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPct = ((initialSeconds - secondsLeft) / initialSeconds) * 100;
  const elapsedMinutes = Math.max(1, Math.round((initialSeconds - secondsLeft) / 60));

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await sessionsApi.complete(session.id, elapsedMinutes, notes, proficiency);
      addToast('Study session completed and progress logged!', 'success');
      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      } catch (e) {}
      if (onSessionCompleted) onSessionCompleted();
      onClose();
    } catch (err) {
      addToast('Failed to log session completion.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px', textAlign: 'center' }}>
        {/* Header Topic details */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#A5B4FC',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '0.5rem'
          }}>
            <BookOpen size={14} />
            {session.subject_name || 'Subject'}
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
            {session.topic_name || 'Study Topic'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Target: {session.duration_minutes} mins focus session
          </p>
        </div>

        {/* Circular Countdown Progress Ring */}
        <div style={{
          position: 'relative',
          width: '200px',
          height: '200px',
          margin: '0 auto 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="100"
              cy="100"
              r="84"
              stroke="#374151"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="100"
              cy="100"
              r="84"
              stroke="#6366F1"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={527.7}
              strokeDashoffset={527.7 - (527.7 * progressPct) / 100}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#FFFFFF' }}>
              {formatTime(secondsLeft)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {isActive ? 'FOCUSING' : 'PAUSED'}
            </div>
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setIsActive(!isActive)}
            className="btn btn-secondary"
            style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px' }}
          >
            {isActive ? <Pause size={18} /> : <Play size={18} />}
            <span>{isActive ? 'Pause Timer' : 'Resume'}</span>
          </button>
        </div>

        {/* Notes & Topic Proficiency Rating */}
        <div style={{ textAlign: 'left', background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            Session Reflection & Notes (optional)
          </label>
          <textarea
            rows="2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key concepts reviewed, questions to ask AI tutor, or breakthrough insights..."
            style={{ fontSize: '0.85rem', resize: 'none' }}
          />

          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Updated Topic Proficiency:</span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setProficiency(lvl)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: proficiency === lvl ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: proficiency === lvl ? '#FFFFFF' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Close / Run in Background
          </button>
          <button
            type="button"
            onClick={handleFinish}
            className="btn btn-success"
            disabled={isSubmitting}
          >
            <CheckCircle size={16} />
            <span>{isSubmitting ? 'Logging...' : 'Mark Session Completed'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
