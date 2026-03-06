import { useState, useEffect, useCallback } from 'react';
import { listTickets } from '../../api/tickets';
import TicketCard from './TicketCard';
import './TicketList.css';

const CATEGORIES = ['', 'billing', 'technical', 'account', 'general'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'critical'];
const STATUSES = ['', 'open', 'in_progress', 'resolved', 'closed'];

export default function TicketList({ refreshKey }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ category: '', priority: '', status: '', search: '' });
  const [searchInput, setSearchInput] = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listTickets(filters);
      setTickets(data);
    } catch {
      setError('Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }, [filters, refreshKey]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setFilters(f => ({ ...f, search: searchInput })), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  function handleFilter(e) {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }

  function handleTicketUpdated(updated) {
    setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
  }

  return (
    <div className="ticket-list-container">
      <div className="list-header">
        <h2>All Tickets <span className="count-badge">{tickets.length}</span></h2>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search title or description..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
        <select name="category" value={filters.category} onChange={handleFilter} className="filter-select">
          {CATEGORIES.map(c => <option key={c} value={c}>{c ? c.charAt(0).toUpperCase() + c.slice(1) : 'All Categories'}</option>)}
        </select>
        <select name="priority" value={filters.priority} onChange={handleFilter} className="filter-select">
          {PRIORITIES.map(p => <option key={p} value={p}>{p ? p.charAt(0).toUpperCase() + p.slice(1) : 'All Priorities'}</option>)}
        </select>
        <select name="status" value={filters.status} onChange={handleFilter} className="filter-select">
          {STATUSES.map(s => <option key={s} value={s}>{s ? s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All Statuses'}</option>)}
        </select>
      </div>

      {loading && <div className="loading-msg">Loading tickets...</div>}
      {error && <div className="error-msg">{error}</div>}
      {!loading && !error && tickets.length === 0 && (
        <div className="empty-msg">No tickets found. Try adjusting your filters.</div>
      )}
      <div className="tickets-grid">
        {tickets.map(ticket => (
          <TicketCard key={ticket.id} ticket={ticket} onUpdated={handleTicketUpdated} />
        ))}
      </div>
    </div>
  );
}
