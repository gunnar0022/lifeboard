import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader, Check } from 'lucide-react';
import { useApi, apiPost, apiPut, apiDelete } from '../../../../../hooks/useApi';
import NoteTypeBar from './NoteTypeBar';
import NoteCard from './NoteCard';

export default function NotesTab({ campaignId }) {
  const { data: allNotes, loading, refetch } = useApi(`/api/dnd/campaigns/${campaignId}/notes`);
  const [activeType, setActiveType] = useState('character');
  const [newNoteId, setNewNoteId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved');

  // Count notes by type
  const counts = {};
  (allNotes || []).forEach(n => {
    counts[n.type] = (counts[n.type] || 0) + 1;
  });

  // Filter by active type
  const filteredNotes = (allNotes || []).filter(n => n.type === activeType);

  const handleAddNote = useCallback(async () => {
    try {
      const result = await apiPost(`/api/dnd/campaigns/${campaignId}/notes`, {
        type: activeType,
        title: '',
        body: '',
      });
      setNewNoteId(result.id);
      refetch();
    } catch (e) {
      console.error('Failed to create note:', e);
    }
  }, [campaignId, activeType, refetch]);

  const handleUpdateNote = useCallback(async (noteId, updates) => {
    setSaveStatus('saving');
    try {
      await apiPut(`/api/dnd/campaigns/${campaignId}/notes/${noteId}`, updates);
      setSaveStatus('saved');
      refetch();
    } catch (e) {
      console.error('Failed to update note:', e);
      setSaveStatus('unsaved');
    }
  }, [campaignId, refetch]);

  const handleDeleteNote = useCallback(async (noteId) => {
    try {
      await apiDelete(`/api/dnd/campaigns/${campaignId}/notes/${noteId}`);
      refetch();
    } catch (e) {
      console.error('Failed to delete note:', e);
    }
  }, [campaignId, refetch]);

  // Clear newNoteId after first render so autoFocus only fires once
  useEffect(() => {
    if (newNoteId) {
      const timer = setTimeout(() => setNewNoteId(null), 500);
      return () => clearTimeout(timer);
    }
  }, [newNoteId]);

  if (loading) {
    return <div className="dnd-notes-tab"><Loader size={18} className="dnd-sheet__spinner" /></div>;
  }

  return (
    <div className="dnd-notes-tab">
      <NoteTypeBar activeType={activeType} counts={counts} onSelect={setActiveType} />

      <div className="dnd-notes-tab__header">
        <span className="dnd-notes-tab__count">
          {filteredNotes.length} {filteredNotes.length === 1 ? 'entry' : 'entries'}
        </span>
        <span className={`dnd-notes-tab__save-status dnd-notes-tab__save-status--${saveStatus}`}>
          {saveStatus === 'saving' && <><Loader size={10} className="dnd-sheet__spinner-sm" /> Saving...</>}
          {saveStatus === 'saved' && <><Check size={10} /> Saved</>}
        </span>
        <button className="dnd-add-btn" onClick={handleAddNote}>
          <Plus size={14} /> New
        </button>
      </div>

      <div className="dnd-notes-tab__list">
        {filteredNotes.length === 0 && (
          <div className="dnd-notes-tab__empty">
            No {activeType} notes yet
          </div>
        )}
        {filteredNotes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            onUpdate={handleUpdateNote}
            onDelete={handleDeleteNote}
            autoFocus={note.id === newNoteId}
          />
        ))}
      </div>
    </div>
  );
}
