import { useState, useEffect } from 'react';
import { getStats } from '../../api/tickets';
import './StatsDashboard.css';

const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#7c3aed' };
const CATEGORY_COLORS = { billing: '#6366f1', technical: '#0ea5e9', account: '#f97316', general: '#6b7280' };

export default function StatsDashboard({ refreshKey }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <div className="stats-loading">Loading stats...</div>;
  if (!stats) return null;

  const maxPriority = Math.max(...Object.values(stats.priority_breakdown), 1);
  const maxCategory = Math.max(...Object.values(stats.category_breakdown), 1);

  return (
    <div className="stats-dashboard">
      <h2>Dashboard</h2>

      <div className="stats-top-row">
        <StatCard label="Total Tickets" value={stats.total_tickets} color="#6366f1" />
        <StatCard label="Open" value={stats.open_tickets} color="#ef4444" />
        <StatCard label="Avg / Day" value={stats.avg_tickets_per_day} color="#10b981" />
      </div>

      <div className="breakdown-section">
        <h3>By Priority</h3>
        {Object.entries(stats.priority_breakdown).map(([key, count]) => (
          <BarRow key={key} label={key} count={count} max={maxPriority} color={PRIORITY_COLORS[key]} />
        ))}
      </div>

      <div className="breakdown-section">
        <h3>By Category</h3>
        {Object.entries(stats.category_breakdown).map(([key, count]) => (
          <BarRow key={key} label={key} count={count} max={maxCategory} color={CATEGORY_COLORS[key]} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function BarRow({ label, count, max, color }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="bar-count">{count}</span>
    </div>
  );
}
