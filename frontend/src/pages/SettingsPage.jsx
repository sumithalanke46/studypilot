import React, { useState } from 'react';
import { Settings, Save, Clock, Calendar, Shield, User, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const DAYS_LIST = [
  { id: 'mon', label: 'Monday' },
  { id: 'tue', label: 'Tuesday' },
  { id: 'wed', label: 'Wednesday' },
  { id: 'thu', label: 'Thursday' },
  { id: 'fri', label: 'Friday' },
  { id: 'sat', label: 'Saturday' },
  { id: 'sun', label: 'Sunday' }
];

export const SettingsPage = () => {
  const { user, updatePreferences } = useAuth();
  const { addToast } = useNotification();

  const [dailyHours, setDailyHours] = useState(user?.daily_hours || 3.0);
  const [startTime, setStartTime] = useState(user?.preferred_start_time || '18:00');
  const [endTime, setEndTime] = useState(user?.preferred_end_time || '22:00');
  const [maxSessionMins, setMaxSessionMins] = useState(user?.max_session_mins || 50);
  const [breakMins, setBreakMins] = useState(user?.break_duration_mins || 10);
  const [availableDays, setAvailableDays] = useState(user?.available_days || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  const [saving, setSaving] = useState(false);

  const toggleDay = (dayId) => {
    if (availableDays.includes(dayId)) {
      if (availableDays.length > 1) {
        setAvailableDays(availableDays.filter(d => d !== dayId));
      }
    } else {
      setAvailableDays([...availableDays, dayId]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePreferences({
        daily_hours: parseFloat(dailyHours),
        preferred_start_time: startTime,
        preferred_end_time: endTime,
        max_session_mins: parseInt(maxSessionMins),
        break_duration_mins: parseInt(breakMins),
        available_days: availableDays
      });
      addToast('Study availability settings saved successfully!', 'success');
    } catch (err) {
      addToast('Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF' }}>
          Study Settings & Preferences
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          Configure your daily study capacity, optimal focus blocks, and active weekdays.
        </p>
      </div>

      <form onSubmit={handleSave}>
        {/* Card 1: Time Availability */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Clock size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
              Daily Study Capacity
            </h2>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Target Study Hours Per Day
              </label>
              <span style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: '1rem' }}>
                {dailyHours} hours/day
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={dailyHours}
              onChange={(e) => setDailyHours(e.target.value)}
              style={{ accentColor: 'var(--accent-primary)' }}
            />
          </div>

          <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Preferred Study Window Start
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Preferred Study Window End
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2">
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Max Session Length ({maxSessionMins} mins)
              </label>
              <input
                type="range"
                min="25"
                max="90"
                step="5"
                value={maxSessionMins}
                onChange={(e) => setMaxSessionMins(e.target.value)}
                style={{ accentColor: 'var(--accent-primary)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Inter-Session Break ({breakMins} mins)
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={breakMins}
                onChange={(e) => setBreakMins(e.target.value)}
                style={{ accentColor: 'var(--accent-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Active Weekdays */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Calendar size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
              Available Study Days
            </h2>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Select which days of the week the scheduling algorithm can allocate study slots.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {DAYS_LIST.map((day) => {
              const isSelected = availableDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    background: isSelected ? 'var(--accent-primary)' : 'var(--bg-primary)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary"
          style={{ padding: '0.85rem 2rem', fontSize: '0.95rem' }}
        >
          <Save size={18} />
          <span>{saving ? 'Saving Preferences...' : 'Save Settings'}</span>
        </button>
      </form>
    </div>
  );
};
