import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { NOTE_TYPES } from './NoteTypeBar';

const PLACEHOLDERS = {
  character: 'Who are they? Where did you meet them?',
  place: "What's here? Why does it matter?",
  quest: 'Objective? Who gave it? Status?',
  item: 'What does it do? Who has it?',
  note: 'Session notes, observations, anything...',
  journal: 'What happened this session? Key events, decisions, loot, cliffhangers...',
};

export default function NoteCard({ note, onUpdate, onDelete, autoFocus }) {
  const [editing, setEditing] = useState(!!autoFocus);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [type, setType] = useState(note.type);
  const [sessionTag, setSessionTag] = useState(note.session_tag || '');
  const [inWorldDate, setInWorldDate] = useState(note.in_world_date || '');
  const [confirming, setConfirming] = useState(false);
  const titleRef = useRef(null);
  const saveTimer = useRef(null);
  const editingRef = useRef(editing);
  editingRef.current = editing;

  useEffect(() => {
    if (editing && autoFocus && titleRef.current) titleRef.current.focus();
  }, [editing, autoFocus]);

  // Only sync from props when NOT editing — prevents refetch from
  // resetting the user's in-progress text or kicking them out
  useEffect(() => {
    if (!editingRef.current) {
      setTitle(note.title);
      setBody(note.body);
      setType(note.type);
      setSessionTag(note.session_tag || '');
      setInWorldDate(note.in_world_date || '');
    }
  }, [note.id, note.title, note.body, note.type, note.session_tag, note.in_world_date]);

  // Build the full save payload. Journal fields always ride along (harmless empty
  // strings for other types) so switching a note to/from journal never loses them.
  const payload = (over = {}) => ({
    title, body, type, session_tag: sessionTag, in_world_date: inWorldDate, ...over,
  });

  const scheduleAutosave = (over) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const updates = payload(over);
    saveTimer.current = setTimeout(() => {
      onUpdate(note.id, updates);
    }, 1000);
  };

  const handleTitleChange = (val) => {
    setTitle(val);
    scheduleAutosave({ title: val });
  };

  const handleBodyChange = (val) => {
    setBody(val);
    scheduleAutosave({ body: val });
  };

  const handleSessionTagChange = (val) => {
    setSessionTag(val);
    scheduleAutosave({ session_tag: val });
  };

  const handleInWorldDateChange = (val) => {
    setInWorldDate(val);
    scheduleAutosave({ in_world_date: val });
  };

  const handleTypeChange = (val) => {
    setType(val);
    onUpdate(note.id, payload({ type: val }));
  };

  const handleDone = () => {
    // Flush any pending save
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (title !== note.title || body !== note.body || type !== note.type
      || sessionTag !== (note.session_tag || '') || inWorldDate !== (note.in_world_date || '')) {
      onUpdate(note.id, payload());
    }
    setEditing(false);
  };

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

  if (confirming) {
    return (
      <div className="dnd-note-card dnd-note-card--confirm">
        <span>Delete this note?</span>
        <div className="dnd-note-card__confirm-btns">
          <button onClick={() => { onDelete(note.id); setConfirming(false); }}>Yes</button>
          <button onClick={() => setConfirming(false)}>No</button>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="dnd-note-card dnd-note-card--editing">
        <div className="dnd-note-card__edit-header">
          <input
            ref={titleRef}
            className="dnd-note-card__title-input"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Title..."
          />
          <select
            className="dnd-note-card__type-select"
            value={type}
            onChange={e => handleTypeChange(e.target.value)}
          >
            {NOTE_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.icon} {t.label.slice(0, -1)}</option>
            ))}
          </select>
          <button className="dnd-note-card__done-btn" onClick={handleDone} title="Done editing">
            Done
          </button>
          <button className="dnd-note-card__delete" onClick={() => setConfirming(true)}>
            <X size={14} />
          </button>
        </div>
        {type === 'journal' && (
          <div className="dnd-note-card__journal-meta">
            <input
              className="dnd-note-card__journal-field"
              value={sessionTag}
              onChange={e => handleSessionTagChange(e.target.value)}
              placeholder="Session # / title (e.g. Session 12)"
            />
            <input
              className="dnd-note-card__journal-field"
              value={inWorldDate}
              onChange={e => handleInWorldDateChange(e.target.value)}
              placeholder="In-world date (e.g. 14th of Mirtul)"
            />
          </div>
        )}
        <textarea
          className="dnd-note-card__body-input"
          value={body}
          onChange={e => handleBodyChange(e.target.value)}
          placeholder={PLACEHOLDERS[type] || PLACEHOLDERS.note}
          rows={3}
        />
      </div>
    );
  }

  return (
    <div className="dnd-note-card" onClick={() => setEditing(true)}>
      <div className="dnd-note-card__header">
        <span className="dnd-note-card__title">{title || 'Untitled'}</span>
        <button className="dnd-note-card__delete" onClick={e => { e.stopPropagation(); setConfirming(true); }}>
          <X size={14} />
        </button>
      </div>
      {type === 'journal' && (sessionTag || inWorldDate) && (
        <div className="dnd-note-card__journal-tags">
          {sessionTag && <span className="dnd-note-card__journal-chip">{sessionTag}</span>}
          {inWorldDate && <span className="dnd-note-card__journal-chip dnd-note-card__journal-chip--date">{inWorldDate}</span>}
        </div>
      )}
      {body && <p className="dnd-note-card__body">{body}</p>}
    </div>
  );
}
