import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import FeatForm, { featToDraft, featDraftToPayload } from './FeatForm';

/**
 * Full feat readout — the deepest frame on the feats branch. In edit mode the
 * feat is directly editable (PUT) and deletable, so the Encyclopedia is the
 * central place to curate the shared feat library.
 */
export default function FeatDetailView({ featId, preview, editMode, onDeleted }) {
  const [feat, setFeat] = useState(preview || null);
  const [loading, setLoading] = useState(!preview);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/dnd/feats/${featId}`)
      .then(r => r.json())
      .then(f => { if (alive) setFeat(f); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [featId]);

  if (!feat) return <div className="wiki-detail">{loading ? 'Loading feat…' : 'Feat not found.'}</div>;

  const startEdit = () => { setDraft(featToDraft(feat)); setEditing(true); };

  const save = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dnd/feats/${featId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(featDraftToPayload(draft)),
      });
      setFeat(await res.json());
      setEditing(false);
    } catch (e) {
      console.error('Update feat failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${feat.name}" from the library?`)) return;
    try {
      await fetch(`/api/dnd/feats/${featId}`, { method: 'DELETE' });
      onDeleted && onDeleted();
    } catch (e) {
      console.error('Delete feat failed:', e);
    }
  };

  if (editing && draft) {
    return (
      <div className="wiki-detail">
        <h2 className="wiki-detail__name">Editing {feat.name}</h2>
        <FeatForm draft={draft} onChange={setDraft} />
        <div className="spell-modal__form-actions">
          <button className="dnd-add-btn" onClick={() => setEditing(false)}>Cancel</button>
          <button className="spell-modal__submit" onClick={save} disabled={saving || !draft.name.trim()}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  const fixedAbility = feat.asi && feat.asi.fixed ? Object.keys(feat.asi.fixed)[0] : null;

  return (
    <div className="wiki-detail">
      <header className="wiki-detail__hero">
        <span className="wiki-detail__kicker">Feat{feat.is_custom ? ' · Homebrew' : ` · ${feat.source || 'PHB'}`}</span>
        <h2 className="wiki-detail__name">{feat.name}</h2>
        <div className="wiki-spell-flags">
          {feat.prerequisite && <span className="wiki-flag">Prereq: {feat.prerequisite}</span>}
          {fixedAbility && <span className="wiki-flag">+1 {fixedAbility}</span>}
        </div>
        {editMode && (
          <div className="wiki-item__actions">
            <button className="dnd-add-btn" onClick={startEdit}><Pencil size={13} /> Edit</button>
            <button className="dnd-equipment__remove" onClick={remove}><Trash2 size={14} /></button>
          </div>
        )}
      </header>

      {feat.description && (
        <section className="wiki-section">
          <p className="wiki-detail__overview">{feat.description}</p>
        </section>
      )}

      {(feat.benefits || []).length > 0 && (
        <section className="wiki-section">
          <h3 className="wiki-section__title">Benefits</h3>
          <ul className="wiki-feat__benefits">
            {feat.benefits.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
