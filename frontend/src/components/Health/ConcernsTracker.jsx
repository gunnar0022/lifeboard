import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, CheckCircle2, ChevronDown, ChevronRight,
  MessageSquare, Clock, Stethoscope, Plus, Pencil, Trash2, Check, X, RotateCcw,
} from 'lucide-react';
import { apiPost, apiPut, apiDelete } from '../../hooks/useApi';
import './ConcernsTracker.css';

function daysSince(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - d) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
}

function ConcernLog({ log }) {
  const isFleet = log.source === 'fleet_visit';
  return (
    <div className={`concern-log ${isFleet ? 'concern-log--fleet' : ''}`}>
      <div className="concern-log__meta">
        <span className="concern-log__source">
          {isFleet ? <Stethoscope size={11} /> : <MessageSquare size={11} />}
          {isFleet ? 'Fleet' : 'You'}
        </span>
        <span className="concern-log__date mono">{formatDate(log.created_at)}</span>
      </div>
      <p className="concern-log__content">{log.content}</p>
    </div>
  );
}

function ActiveConcern({ concern, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(concern.title);
  const [description, setDescription] = useState(concern.description || '');
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [busy, setBusy] = useState(false);

  const days = daysSince(concern.created_at);
  const logCount = concern.logs?.length || concern.log_count || 0;

  const saveEdit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await apiPut(`/api/health_body/concerns/${concern.id}`, { title: title.trim(), description });
      setEditing(false);
      onUpdate?.();
    } catch (e) { console.error('Failed to edit concern:', e); }
    finally { setBusy(false); }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    try {
      await apiPost(`/api/health_body/concerns/${concern.id}/logs`, { content: note.trim() });
      setNote('');
      setNoteOpen(false);
      onUpdate?.();
    } catch (e) { console.error('Failed to add note:', e); }
    finally { setBusy(false); }
  };

  const resolve = async () => {
    setBusy(true);
    try {
      await apiPost(`/api/health_body/concerns/${concern.id}/resolve`, { resolution_summary: resolution.trim() });
      setResolveOpen(false);
      onUpdate?.();
    } catch (e) { console.error('Failed to resolve concern:', e); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm(`Delete concern “${concern.title}”? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await apiDelete(`/api/health_body/concerns/${concern.id}`);
      onUpdate?.();
    } catch (e) { console.error('Failed to delete concern:', e); }
    finally { setBusy(false); }
  };

  return (
    <div className="concern-item concern-item--active">
      <button className="concern-item__header" onClick={() => setExpanded(!expanded)}>
        <div className="concern-item__title-row">
          <AlertCircle size={14} className="concern-item__icon concern-item__icon--active" />
          <span className="concern-item__title">{concern.title}</span>
        </div>
        <div className="concern-item__meta">
          <span className="concern-item__stat"><Clock size={11} /> {days}d</span>
          <span className="concern-item__stat"><MessageSquare size={11} /> {logCount}</span>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="concern-item__detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {editing ? (
              <div className="concern-edit">
                <input className="concern-edit__input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
                <textarea className="concern-edit__textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={3} />
                <div className="concern-edit__actions">
                  <button className="concern-btn" onClick={() => setEditing(false)} disabled={busy}><X size={13} /> Cancel</button>
                  <button className="concern-btn concern-btn--primary" onClick={saveEdit} disabled={busy || !title.trim()}><Check size={13} /> Save</button>
                </div>
              </div>
            ) : (
              <>
                {concern.description && <p className="concern-item__description">{concern.description}</p>}
                {concern.logs && concern.logs.length > 0 ? (
                  <div className="concern-item__logs">
                    {concern.logs.map(log => <ConcernLog key={log.id} log={log} />)}
                  </div>
                ) : (
                  <p className="concern-item__empty-logs">No log entries yet.</p>
                )}

                {noteOpen && (
                  <div className="concern-edit">
                    <textarea className="concern-edit__textarea" value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note…" rows={2} autoFocus />
                    <div className="concern-edit__actions">
                      <button className="concern-btn" onClick={() => setNoteOpen(false)} disabled={busy}><X size={13} /> Cancel</button>
                      <button className="concern-btn concern-btn--primary" onClick={addNote} disabled={busy || !note.trim()}><Check size={13} /> Add note</button>
                    </div>
                  </div>
                )}

                {resolveOpen && (
                  <div className="concern-edit">
                    <input className="concern-edit__input" value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Resolution summary (optional)" />
                    <div className="concern-edit__actions">
                      <button className="concern-btn" onClick={() => setResolveOpen(false)} disabled={busy}><X size={13} /> Cancel</button>
                      <button className="concern-btn concern-btn--success" onClick={resolve} disabled={busy}><CheckCircle2 size={13} /> Mark resolved</button>
                    </div>
                  </div>
                )}

                {!noteOpen && !resolveOpen && (
                  <div className="concern-item__toolbar">
                    <button className="concern-btn" onClick={() => setNoteOpen(true)}><Plus size={12} /> Note</button>
                    <button className="concern-btn" onClick={() => setEditing(true)}><Pencil size={12} /> Edit</button>
                    <button className="concern-btn" onClick={() => setResolveOpen(true)}><CheckCircle2 size={12} /> Resolve</button>
                    <button className="concern-btn concern-btn--danger" onClick={remove} disabled={busy}><Trash2 size={12} /> Delete</button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResolvedConcern({ concern, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  const reactivate = async () => {
    setBusy(true);
    try {
      await apiPost(`/api/health_body/concerns/${concern.id}/reactivate`);
      onUpdate?.();
    } catch (e) { console.error('Failed to reactivate concern:', e); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm(`Delete concern “${concern.title}”? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await apiDelete(`/api/health_body/concerns/${concern.id}`);
      onUpdate?.();
    } catch (e) { console.error('Failed to delete concern:', e); }
    finally { setBusy(false); }
  };

  return (
    <div className="concern-item concern-item--resolved">
      <button className="concern-item__header" onClick={() => setExpanded(!expanded)}>
        <div className="concern-item__title-row">
          <CheckCircle2 size={14} className="concern-item__icon concern-item__icon--resolved" />
          <span className="concern-item__title">{concern.title}</span>
        </div>
        <div className="concern-item__meta">
          <span className="concern-item__dates mono">
            {formatDate(concern.created_at)} &rarr; {formatDate(concern.resolved_at)}
          </span>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="concern-item__detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {concern.resolution_summary && <p className="concern-item__resolution">{concern.resolution_summary}</p>}
            {concern.compressed_at && <p className="concern-item__compressed">Logs archived {formatDate(concern.compressed_at)}</p>}
            <div className="concern-item__toolbar">
              <button className="concern-btn" onClick={reactivate} disabled={busy}><RotateCcw size={12} /> Reopen</button>
              <button className="concern-btn concern-btn--danger" onClick={remove} disabled={busy}><Trash2 size={12} /> Delete</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ConcernsTracker({ concerns, onUpdate }) {
  const [showResolved, setShowResolved] = useState(false);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const active = concerns?.active || [];
  const resolved = concerns?.resolved || [];

  const create = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await apiPost('/api/health_body/concerns', { title: title.trim(), description: description.trim() });
      setTitle('');
      setDescription('');
      setAdding(false);
      onUpdate?.();
    } catch (e) { console.error('Failed to create concern:', e); }
    finally { setBusy(false); }
  };

  return (
    <div className="concerns-tracker card">
      <div className="concerns-tracker__header concerns-tracker__header--row">
        <h3 className="chart-title">
          <Stethoscope size={16} />
          Health Concerns
          {active.length > 0 && <span className="concerns-tracker__count">{active.length} active</span>}
        </h3>
        {!adding && (
          <button className="concern-btn concern-btn--primary" onClick={() => setAdding(true)}>
            <Plus size={13} /> New
          </button>
        )}
      </div>

      {adding && (
        <div className="concern-edit concern-edit--create">
          <input className="concern-edit__input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Concern title" autoFocus />
          <textarea className="concern-edit__textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} />
          <div className="concern-edit__actions">
            <button className="concern-btn" onClick={() => setAdding(false)} disabled={busy}><X size={13} /> Cancel</button>
            <button className="concern-btn concern-btn--primary" onClick={create} disabled={busy || !title.trim()}><Check size={13} /> Create</button>
          </div>
        </div>
      )}

      {active.length > 0 && (
        <div className="concerns-tracker__section">
          {active.map(c => <ActiveConcern key={c.id} concern={c} onUpdate={onUpdate} />)}
        </div>
      )}

      {active.length === 0 && !adding && (
        <p className="concerns-tracker__empty">No active concerns. Add one to start tracking.</p>
      )}

      {resolved.length > 0 && (
        <div className="concerns-tracker__resolved-section">
          <button className="concerns-tracker__resolved-toggle" onClick={() => setShowResolved(!showResolved)}>
            {showResolved ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Resolved ({resolved.length})
          </button>

          <AnimatePresence>
            {showResolved && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {resolved.map(c => <ResolvedConcern key={c.id} concern={c} onUpdate={onUpdate} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
