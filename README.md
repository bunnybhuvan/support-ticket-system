# Support Ticket System

A full-stack support ticket management system with AI-powered ticket classification.

## Tech Stack
- **Backend**: Django 4.2 + Django REST Framework + PostgreSQL
- **Frontend**: React 18 + Vite
- **LLM**: Anthropic Claude (claude-haiku-4-5-20251001)
- **Infrastructure**: Docker + Docker Compose

## Quick Start

### 1. Set your API key

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 2. Run the app

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/tickets/
- Django Admin: http://localhost:8000/admin/

The app is fully functional without an API key — LLM suggestions will simply be unavailable.

## LLM Choice: Anthropic Claude

I chose **Claude Haiku** (`claude-haiku-4-5-20251001`) for three reasons:

1. **Speed**: Haiku is the fastest Claude model, keeping the classify-on-blur UX responsive.
2. **Cost**: Token usage for classification is minimal; Haiku is the most economical option.
3. **Reliability**: Claude follows strict JSON-only output instructions well, reducing parse failures.

The prompt is in `backend/tickets_project/tickets/llm.py`. Key design choices:
- System prompt specifies exact output format (`{"category": "...", "priority": "..."}`)
- Clear definitions for each priority level reduce ambiguity
- All LLM errors are caught in `llm.py` — the classify endpoint always returns 200 (with `llm_available: false` on failure), so ticket submission is never blocked

## Design Decisions

### Stats endpoint
Uses Django ORM `aggregate()` + `annotate()` for all calculations — no Python-level iteration over querysets. `Count` with `filter=` handles conditional aggregation cleanly.

### URL ordering
`/api/tickets/stats/` and `/api/tickets/classify/` are registered **before** `/api/tickets/<id>/` to prevent Django from interpreting "stats" and "classify" as integer IDs.

### classify-on-blur UX
The description textarea triggers classification with an 800ms debounce. Dropdowns are pre-filled with suggestions but remain fully editable. If the user has already manually selected a value, the AI suggestion does not overwrite it.

### Frontend state
A `refreshKey` integer in `App.jsx` is incremented on every successful ticket creation. Both `TicketList` and `StatsDashboard` receive it as a prop and re-fetch when it changes — clean auto-refresh without polling.

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets/` | List tickets. Supports `?category=`, `?priority=`, `?status=`, `?search=` |
| POST | `/api/tickets/` | Create ticket → 201 |
| PATCH | `/api/tickets/<id>/` | Update ticket fields |
| GET | `/api/tickets/stats/` | Aggregated statistics |
| POST | `/api/tickets/classify/` | LLM-suggest category + priority |
