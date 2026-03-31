import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { NOTE_TYPES } from './NoteTypeBar';

const PLACEHOLDERS = {
  character: 'Who are they? Where did you meet them?',
  place: "What's here? Why does it matter?",
  quest: 'Objective? Who gave it? Status?',
  item: 'What does it do? Who has it?',
  note: 'Session notes, observations, anything...',
};

export default function NoteCard({ note, onUpdate, onDelete, autoFocus }) {
  const [editing, setEditing] = useState(!!autoFocus);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [type, setType] = useState(note.type);
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
    }
  }, [note.id, note.title, note.body, note.type]);

  const scheduleAutosave = (updates) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onUpdate(note.id, updates);
    }, 1000);
  };

  const handleTitleChange = (val) => {
    setTitle(val);
    scheduleAutosave({ title: val, body, type });
  };

  const handleBodyChange = (val) => {
    setBody(val);
    scheduleAutosave({ title, body: val, type });
  };

  const handleTypeChange = (val) => {
    setType(val);
    onUpdate(note.id, { title, body, type: val });
  };

  const handleDone = () => {
    // Flush any pending save
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (title !== note.title || body !== note.body || type !== note.type) {
      onUpdate(note.id, { title, body, type });
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
      {body && <p className="dnd-note-card__body">{body}</p>}
    </div>
  );
}
