import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { BarChart3, TrendingUp, Sparkles, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { analyticsApi } from '../api/analytics';
import { useNotification } from '../contexts/NotificationContext';

const RISK_COLORS = {
  HIGH: '#EF4444',
  MEDIUM: '#F59E0B',
  LOW: '#10B981'
};

export const AnalyticsPage = () => {
  const { addToast } = useNotification();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await analyticsApi.getDashboard();
        setAnalytics(data);
      } catch (err) {
        addToast('Failed to load analytics.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !analytics) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
        <Sparkles size={32} className="spin" style={{ margin: '0 auto 1rem', color: 'var(--accent-primary)' }} />
        <p>Crunching your analytics data...</p>
      </div>
    );
  }

  // Prep data for Weak Topic Risk Distribution Pie
  const riskCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  if (analytics.weak_topics) {
    analytics.weak_topics.forEach((wt) => {
      if (riskCounts[wt.risk_level] !== undefined) {
        riskCounts[wt.risk_level]++;
      }
    });
  }

  const riskPieData = [
    { name: 'High Risk', value: riskCounts.HIGH, color: '#EF4444' },
    { name: 'Medium Risk', value: riskCounts.MEDIUM, color: '#F59E0B' },
    { name: 'Low Risk', value: riskCounts.LOW, color: '#10B981' }
  ].filter(d => d.value > 0);

  // Subject Readiness Bar Data
  const subjectReadinessData = (analytics.subject_readiness || []).map(sr => ({
    name: sr.subject_name,
    readiness: sr.readiness_percentage,
    completedTopics: sr.completed_topics_count,
    totalTopics: sr.topics_count,
    color: sr.color || '#4F46E5'
  }));

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF' }}>
          Performance & Readiness Analytics
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          Data-driven metrics computed from your actual study completions, quiz evaluations, and deadlines.
        </p>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <TrendingUp size={18} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Overall Readiness
            </span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FFFFFF' }}>
            {analytics.overall_readiness_percentage}%
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Formula: 40% Topic Progress + 35% Proficiency + 25% Quiz Score
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Clock size={18} color="#10B981" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Weekly Study Volume
            </span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10B981' }}>
            {analytics.weekly_completed_hours} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>hours</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Total tracked across the past 7 days
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <CheckCircle2 size={18} color="#06B6D4" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Schedule Adherence
            </span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FFFFFF' }}>
            {analytics.streak?.completion_rate_percentage || 100}%
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {analytics.streak?.total_sessions_completed || 0} completed vs missed ratio
          </p>
        </div>
      </div>

      {/* Main Charts 2x2 Grid */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Chart 1: Daily Study Hours */}
        <div className="card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '1rem' }}>
            Daily Study Time (Last 7 Days)
          </h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.daily_hours_history || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day_name" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} unit="m" />
                <Tooltip
                  contentStyle={{ background: '#1F2937', borderColor: '#374151', borderRadius: '8px', color: '#FFFFFF' }}
                  formatter={(val, name) => [`${val} mins`, name === 'completed_minutes' ? 'Completed' : 'Planned']}
                />
                <Bar dataKey="planned_minutes" fill="#374151" radius={[4, 4, 0, 0]} name="Planned" />
                <Bar dataKey="completed_minutes" fill="#6366F1" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Subject Readiness */}
        <div className="card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '1rem' }}>
            Subject Readiness Comparison (%)
          </h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectReadinessData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" domain={[0, 100]} stroke="#9CA3AF" fontSize={12} unit="%" />
                <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={11} width={110} />
                <Tooltip
                  contentStyle={{ background: '#1F2937', borderColor: '#374151', borderRadius: '8px', color: '#FFFFFF' }}
                  formatter={(val) => [`${val}%`, 'Readiness']}
                />
                <Bar dataKey="readiness" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weak Topics Deep Breakdown Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '1rem' }}>
          Diagnostic Weak-Topic Risk Rankings
        </h3>

        {!analytics.weak_topics || analytics.weak_topics.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No weak topics currently flagged.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Topic Name</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Subject</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Risk Level</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Difficulty</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Proficiency</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Quiz Recall</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Primary Risk Factor</th>
                </tr>
              </thead>
              <tbody>
                {analytics.weak_topics.map((wt) => (
                  <tr key={wt.topic_id} style={{ borderBottom: '1px solid rgba(55, 65, 81, 0.5)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#FFFFFF' }}>
                      {wt.topic_name}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: wt.subject_color || 'var(--text-secondary)' }}>
                      {wt.subject_name}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span className={`badge badge-${wt.risk_level === 'HIGH' ? 'urgent' : (wt.risk_level === 'MEDIUM' ? 'high' : 'low')}`}>
                        {wt.risk_level}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                      Level {wt.difficulty}/5
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: wt.proficiency <= 2 ? '#F87171' : 'var(--text-secondary)' }}>
                      Level {wt.proficiency}/5
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#FFFFFF', fontWeight: 600 }}>
                      {wt.recent_quiz_score !== null ? `${wt.recent_quiz_score}%` : 'Not tested'}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>
                      {wt.primary_reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
