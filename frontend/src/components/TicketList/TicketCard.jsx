import { useState } from 'react';
import { updateTicket } from '../../api/tickets';

const STATUS_FLOW = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#7c3aed' };
const STATUS_COLORS = { open: '#6366f1', in_progress: '#f59e0b', resolved: '#10b981', closed: '#6b7280' };

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TicketCard({ ticket, onUpdated }) {
  const [updating, setUpdating] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const currentIdx = STATUS_FLOW.indexOf(ticket.status);
  const nextStatus = currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;

  async function handleAdvanceStatus() {
    if (!nextStatus) return;
    setUpdating(true);
    try {
      const updated = await updateTicket(ticket.id, { status: nextStatus });
      onUpdated(updated);
    } finally {
      setUpdating(false);
    }
  }

  const shortDesc = ticket.description.length > 120
    ? ticket.description.slice(0, 120) + '...'
    : ticket.description;

  return (
    <div className="ticket-card">
      <div className="ticket-header" onClick={() => setExpanded(e => !e)}>
        <div className="ticket-meta-left">
          <span className="ticket-id">#{ticket.id}</span>
          <h3 className="ticket-title">{ticket.title}</h3>
        </div>
        <span className="expand-icon">{expanded ? '▲' : '▼'}</span>
      </div>

      <p className="ticket-desc">{expanded ? ticket.description : shortDesc}</p>

      <div className="ticket-footer">
        <div className="ticket-badges">
          <span className="badge" style={{ background: PRIORITY_COLORS[ticket.priority] + '22', color: PRIORITY_COLORS[ticket.priority], border: `1px solid ${PRIORITY_COLORS[ticket.priority]}44` }}>
            {ticket.priority}
          </span>
          <span className="badge category-badge">{ticket.category}</span>
          <span className="badge" style={{ background: STATUS_COLORS[ticket.status] + '22', color: STATUS_COLORS[ticket.status], border: `1px solid ${STATUS_COLORS[ticket.status]}44` }}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>
        <div className="ticket-actions">
          <span className="ticket-date">{formatDate(ticket.created_at)}</span>
          {nextStatus && (
            <button className="advance-btn" onClick={handleAdvanceStatus} disabled={updating}>
              {updating ? '...' : `→ ${nextStatus.replace('_', ' ')}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
