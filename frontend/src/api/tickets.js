const BASE = '/api';

export async function listTickets(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);

  const res = await fetch(`${BASE}/tickets/?${params}`);
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return res.json();
}

export async function createTicket(data) {
  const res = await fetch(`${BASE}/tickets/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error('Failed to create ticket'), { details: err });
  }
  return res.json();
}

export async function updateTicket(id, data) {
  const res = await fetch(`${BASE}/tickets/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update ticket');
  return res.json();
}

export async function getStats() {
  const res = await fetch(`${BASE}/tickets/stats/`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function classifyTicket(description) {
  const res = await fetch(`${BASE}/tickets/classify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) return null;
  return res.json();
}
