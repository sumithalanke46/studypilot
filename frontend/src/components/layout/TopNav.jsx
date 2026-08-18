import React, { useState } from 'react';
import { Bell, Sparkles, AlertCircle, CheckCircle2, BookOpen, Calendar, Menu, X } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const TopNav = ({ onMobileToggle }) => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'exam_alert': return <Calendar size={16} color="#F87171" />;
      case 'weak_topic': return <AlertCircle size={16} color="#FBBF24" />;
      case 'session_reminder': return <BookOpen size={16} color="#60A5FA" />;
      default: return <Sparkles size={16} color="#A78BFA" />;
    }
  };

  return (
    <header style={{
      height: '64px',
      background: 'rgba(17, 24, 39, 0.85)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Left side / Mobile Menu Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onMobileToggle}
          style={{ display: 'none', color: 'var(--text-primary)', padding: '0.4rem' }}
          className="mobile-toggle"
        >
          <Menu size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Adaptive Target:</span>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            background: 'rgba(99, 102, 241, 0.2)',
            color: '#818CF8',
            padding: '0.2rem 0.6rem',
            borderRadius: '6px',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            {user?.daily_hours || 3.0} hrs/day • {user?.preferred_start_time || '18:00'}-{user?.preferred_end_time || '22:00'}
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
        {/* Notifications Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'background var(--transition-fast)'
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '18px',
                height: '18px',
                background: '#EF4444',
                color: '#FFFFFF',
                borderRadius: '50%',
                fontSize: '0.68rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: 0,
              width: '360px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              zIndex: 1000,
              overflow: 'hidden',
              animation: 'modalFadeIn 0.15s ease-out'
            }}>
              <div style={{
                padding: '0.85rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFFFFF' }}>
                  Notifications ({unreadCount} new)
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No notifications yet. You're all caught up!
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) {
                          navigate(n.link);
                          setShowDropdown(false);
                        }
                      }}
                      style={{
                        padding: '0.85rem 1rem',
                        borderBottom: '1px solid var(--border-color)',
                        background: n.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '0.75rem',
                        transition: 'background var(--transition-fast)'
                      }}
                    >
                      <div style={{ marginTop: '2px' }}>
                        {getNotificationIcon(n.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: n.is_read ? 500 : 700, fontSize: '0.85rem', color: '#FFFFFF', marginBottom: '2px' }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {n.message}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI Tutor Quick Access Button */}
        <button
          onClick={() => navigate('/ai-tutor')}
          className="btn btn-primary"
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
        >
          <Sparkles size={15} />
          <span>Ask AI Tutor</span>
        </button>
      </div>
    </header>
  );
};
