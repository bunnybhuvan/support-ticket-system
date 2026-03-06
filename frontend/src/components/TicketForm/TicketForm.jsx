import { useState, useRef } from 'react';
import { createTicket, classifyTicket } from '../../api/tickets';
import './TicketForm.css';

const CATEGORIES = ['billing', 'technical', 'account', 'general'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const EMPTY_FORM = { title: '', description: '', category: '', priority: '' };

export default function TicketForm({ onTicketCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [classifying, setClassifying] = useState(false);
  const [llmSuggested, setLlmSuggested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const classifyTimeoutRef = useRef(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));

    if (name === 'description') {
      setLlmSuggested(false);
      clearTimeout(classifyTimeoutRef.current);
      if (value.trim().length >= 20) {
        classifyTimeoutRef.current = setTimeout(() => runClassify(value), 800);
      }
    }
  }

  async function runClassify(description) {
    setClassifying(true);
    try {
      const result = await classifyTicket(description);
      if (result && result.suggested_category && result.suggested_priority) {
        setForm(prev => ({
          ...prev,
          category: result.suggested_category,
          priority: result.suggested_priority,
        }));
        setLlmSuggested(true);
      }
    } finally {
      setClassifying(false);
    }
  }

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    else if (form.title.length > 200) errs.title = 'Max 200 characters';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.category) errs.category = 'Category is required';
    if (!form.priority) errs.priority = 'Priority is required';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const ticket = await createTicket(form);
      setForm(EMPTY_FORM);
      setLlmSuggested(false);
      setSuccessMsg('Ticket #' + ticket.id + ' created successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      onTicketCreated(ticket);
    } catch (err) {
      const details = err.details || {};
      const mapped = {};
      for (const [k, v] of Object.entries(details)) {
        mapped[k] = Array.isArray(v) ? v.join(' ') : v;
      }
      setErrors(Object.keys(mapped).length ? mapped : { form: 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ticket-form-card">
      <h2>Submit a Support Ticket</h2>
      {successMsg && <div className="success-banner">{successMsg}</div>}
      {errors.form && <div className="error-banner">{errors.form}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="title">Title <span className="req">*</span></label>
          <input id="title" name="title" type="text" maxLength={200}
            value={form.title} onChange={handleChange}
            placeholder="Brief summary of the issue"
            className={errors.title ? 'error' : ''} />
          <div className="field-footer">
            {errors.title && <span className="field-error">{errors.title}</span>}
            <span className="char-count">{form.title.length}/200</span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="description">Description <span className="req">*</span></label>
          <textarea id="description" name="description" rows={5}
            value={form.description} onChange={handleChange}
            placeholder="Describe your issue in detail... (AI will suggest category & priority)"
            className={errors.description ? 'error' : ''} />
          {errors.description && <span className="field-error">{errors.description}</span>}
          {classifying && <div className="llm-status"><span className="spinner" /> Analyzing with AI...</div>}
          {llmSuggested && !classifying && <div className="llm-badge">✨ AI pre-filled category &amp; priority — feel free to change</div>}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="category">Category <span className="req">*</span></label>
            <select id="category" name="category" value={form.category} onChange={handleChange}
              className={errors.category ? 'error' : llmSuggested ? 'llm-filled' : ''}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            {errors.category && <span className="field-error">{errors.category}</span>}
          </div>
          <div className="field">
            <label htmlFor="priority">Priority <span className="req">*</span></label>
            <select id="priority" name="priority" value={form.priority} onChange={handleChange}
              className={errors.priority ? 'error' : llmSuggested ? 'llm-filled' : ''}>
              <option value="">Select priority</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            {errors.priority && <span className="field-error">{errors.priority}</span>}
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={submitting || classifying}>
          {submitting ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
}
