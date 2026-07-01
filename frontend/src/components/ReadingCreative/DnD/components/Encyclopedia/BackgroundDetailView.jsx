import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import BackgroundForm, { backgroundToDraft, backgroundDraftToPayload } from './BackgroundForm';

/**
 * Full background readout — the deepest frame on the backgrounds branch. In edit
 * mode it's directly editable (PUT) and deletable, so the Encyclopedia is the
 * central place to curate the shared background library.
 */
export default function BackgroundDetailView({ bgId, preview, editMode, onDeleted }) {
  const [bg, setBg] = useState(preview || null);
  const [loading, setLoading] = useState(!preview);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/dnd/backgrounds/${bgId}`)
      .then(r => r.json())
      .then(b => { if (alive) setBg(b); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [bgId]);

  if (!bg) return <div className="wiki-detail">{loading ? 'Loading background…' : 'Background not found.'}</div>;

  const startEdit = () => { setDraft(backgroundToDraft(bg)); setEditing(true); };

  const save = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dnd/backgrounds/${bgId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backgroundDraftToPayload(draft)),
      });
      setBg(await res.json());
      setEditing(false);
    } catch (e) {
      console.error('Update background failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${bg.name}" from the library?`)) return;
    try {
      await fetch(`/api/dnd/backgrounds/${bgId}`, { method: 'DELETE' });
      onDeleted && onDeleted();
    } catch (e) {
      console.error('Delete background failed:', e);
    }
  };

  if (editing && draft) {
    return (
      <div className="wiki-detail">
        <h2 className="wiki-detail__name">Editing {bg.name}</h2>
        <BackgroundForm draft={draft} onChange={setDraft} />
        <div className="spell-modal__form-actions">
          <button className="dnd-add-btn" onClick={() => setEditing(false)}>Cancel</button>
          <button className="spell-modal__submit" onClick={save} disabled={saving || !draft.name.trim()}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  const skills = bg.skill_proficiencies || [];
  const tools = bg.tool_proficiencies || [];
  const languages = bg.languages || [];
  const equipment = bg.equipment || [];

  return (
    <div className="wiki-detail">
      <header className="wiki-detail__hero">
        <span className="wiki-detail__kicker">Background{bg.is_custom ? ' · Homebrew' : ` · ${bg.source || 'PHB'}`}</span>
        <h2 className="wiki-detail__name">{bg.name}</h2>
        <div className="wiki-spell-flags">
          {skills.length > 0 && <span className="wiki-flag">Skills: {skills.join(', ')}</span>}
          {tools.length > 0 && <span className="wiki-flag">Tools: {tools.join(', ')}</span>}
          {languages.length > 0 && <span className="wiki-flag">Languages: {languages.join(', ')}</span>}
        </div>
        {editMode && (
          <div className="wiki-item__actions">
            <button className="dnd-add-btn" onClick={startEdit}><Pencil size={13} /> Edit</button>
            <button className="dnd-equipment__remove" onClick={remove}><Trash2 size={14} /></button>
          </div>
        )}
      </header>

      {bg.description && (
        <section className="wiki-section">
          <p className="wiki-detail__overview">{bg.description}</p>
        </section>
      )}

      {equipment.length > 0 && (
        <section className="wiki-section">
          <h3 className="wiki-section__title">Starting Equipment</h3>
          <ul className="wiki-feat__benefits">
            {equipment.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </section>
      )}

      {(bg.feature_name || bg.feature_desc) && (
        <section className="wiki-section">
          <h3 className="wiki-section__title">Feature{bg.feature_name ? `: ${bg.feature_name}` : ''}</h3>
          {bg.feature_desc && <p className="wiki-detail__overview">{bg.feature_desc}</p>}
        </section>
      )}
    </div>
  );
}
