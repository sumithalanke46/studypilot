import React, { useState } from 'react';
import { Sparkles, Calendar, Clock, BookOpen } from 'lucide-react';
import { studyPlanApi } from '../../api/studyPlan';
import { useNotification } from '../../contexts/NotificationContext';

export const GeneratePlanModal = ({ subjects, onClose, onGenerated }) => {
  const { addToast } = useNotification();
  const [days, setDays] = useState(7);
  const [overrideHours, setOverrideHours] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState(subjects.map(s => s.id));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSubject = (id) => {
    if (selectedSubjects.includes(id)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter(sid => sid !== id));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, id]);
    }
  };

  const handleGenerate = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        days: parseInt(days),
        focus_subject_ids: selectedSubjects.length === subjects.length ? null : selectedSubjects,
        override_daily_hours: overrideHours ? parseFloat(overrideHours) : null
      };
      await studyPlanApi.generate(payload);
      addToast('New personalized adaptive study plan generated!', 'success');
      if (onGenerated) onGenerated();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to generate study plan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
              Generate Study Plan
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Deterministic scheduling engine with cognitive interleaving and exam urgency.
            </p>
          </div>
        </div>

        {/* Planning Horizon Slider */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Planning Horizon
            </label>
            <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.9rem' }}>
              {days} Days ({Math.round(days / 7)} {days === 7 ? 'week' : 'weeks'})
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[7, 14, 21, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '6px',
                  background: days === d ? 'var(--accent-primary)' : 'var(--bg-primary)',
                  color: days === d ? '#FFFFFF' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>

        {/* Daily Study Hours Override */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            Target Daily Study Hours (leave blank to use default)
          </label>
          <input
            type="number"
            step="0.5"
            min="1"
            max="12"
            value={overrideHours}
            onChange={(e) => setOverrideHours(e.target.value)}
            placeholder="e.g. 4.0 hours/day"
          />
        </div>

        {/* Subject Filter Checkboxes */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Included Subjects
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '140px', overflowY: 'auto' }}>
            {subjects.map((sub) => (
              <label
                key={sub.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  background: 'var(--bg-primary)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  color: '#FFFFFF'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedSubjects.includes(sub.id)}
                  onChange={() => toggleSubject(sub.id)}
                  style={{ width: 'auto', accentColor: 'var(--accent-primary)' }}
                />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: sub.color || '#4F46E5' }} />
                <span>{sub.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
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
            onClick={handleGenerate}
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            <Sparkles size={16} />
            <span>{isSubmitting ? 'Optimizing...' : 'Generate Adaptive Schedule'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
