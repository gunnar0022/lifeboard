import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { parseSpellClasses, spellClassLabel } from '../Spellcasting/spellTags';
import { spellLevelColor, spellLevelOrdinal } from './spellTheme';
import Mech from './Mech';
import SpellForm, { spellToDraft, spellDraftToPayload } from './SpellForm';

const META_FIELDS = [
  ['casting_time', 'Casting Time'],
  ['range', 'Range'],
  ['aoe', 'Area'],
  ['duration', 'Duration'],
  ['components', 'Components'],
];

/**
 * Full spell readout — the deepest frame on the spell branch. Fetches the full
 * row on demand and presents it with the tier color and mechanical
 * highlighting. The end of the line: spells never link back outward.
 */
export default function SpellDetailView({ spellId, preview, editMode, onDeleted }) {
  const [spell, setSpell] = useState(preview || null);
  const [loading, setLoading] = useState(!preview);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/dnd/spells/${spellId}`)
      .then(r => r.json())
      .then(s => { if (alive) setSpell(s); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [spellId]);

  if (!spell) return <div className="wiki-detail">{loading ? 'Loading spell…' : 'Spell not found.'}</div>;

  const startEdit = () => { setDraft(spellToDraft(spell)); setEditing(true); };

  const save = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dnd/spells/${spellId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spellDraftToPayload(draft)),
      });
      setSpell(await res.json());
      setEditing(false);
    } catch (e) {
      console.error('Update spell failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${spell.name}" from the library?`)) return;
    try {
      await fetch(`/api/dnd/spells/${spellId}`, { method: 'DELETE' });
      onDeleted && onDeleted();
    } catch (e) {
      console.error('Delete spell failed:', e);
    }
  };

  if (editing && draft) {
    return (
      <div className="wiki-detail">
        <h2 className="wiki-detail__name">Editing {spell.name}</h2>
        <SpellForm draft={draft} onChange={setDraft} />
        <div className="spell-modal__form-actions">
          <button className="dnd-add-btn" onClick={() => setEditing(false)}>Cancel</button>
          <button className="spell-modal__submit" onClick={save} disabled={saving || !draft.name.trim()}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  const accent = spellLevelColor(spell.level);
  const tags = parseSpellClasses(spell.classes);

  return (
    <div className="wiki-detail" style={{ '--accent': accent }}>
      <header className="wiki-detail__hero">
        <span className="wiki-detail__kicker">
          {spellLevelOrdinal(spell.level)}{spell.spell_type ? ` · ${spell.spell_type}` : ''}
        </span>
        <h2 className="wiki-detail__name">{spell.name}</h2>
        <div className="wiki-spell-flags">
          {spell.concentration ? <span className="wiki-flag">Concentration</span> : null}
          {spell.ritual ? <span className="wiki-flag">Ritual</span> : null}
        </div>
        {editMode && (
          <div className="wiki-item__actions">
            <button className="dnd-add-btn" onClick={startEdit}><Pencil size={13} /> Edit</button>
            <button className="dnd-equipment__remove" onClick={remove}><Trash2 size={14} /></button>
          </div>
        )}
      </header>

      <div className="wiki-spellmeta">
        {META_FIELDS.map(([key, label]) => spell[key] ? (
          <div key={key} className="wiki-spellmeta__cell">
            <span className="wiki-spellmeta__k">{label}</span>
            <span className="wiki-spellmeta__v"><Mech text={String(spell[key])} /></span>
          </div>
        ) : null)}
        {spell.damage && (
          <div className="wiki-spellmeta__cell">
            <span className="wiki-spellmeta__k">Damage</span>
            <span className="wiki-spellmeta__v mech mech--dice">{spell.damage}</span>
          </div>
        )}
        {spell.save_type && (
          <div className="wiki-spellmeta__cell">
            <span className="wiki-spellmeta__k">Save</span>
            <span className="wiki-spellmeta__v">{spell.save_type}{spell.save_effect ? ` (${spell.save_effect})` : ''}</span>
          </div>
        )}
      </div>

      {spell.description && (
        <section className="wiki-section">
          <p className="wiki-detail__overview"><Mech text={spell.description} /></p>
        </section>
      )}

      {spell.upcast && (
        <div className="wiki-defining">
          <div>
            <span className="wiki-defining__name">At Higher Levels</span>
            <p className="wiki-defining__desc"><Mech text={spell.upcast} /></p>
          </div>
        </div>
      )}

      {tags.length > 0 && (
        <div className="wiki-chips">
          {tags.map(t => <span key={t} className="wiki-chip">{spellClassLabel(t)}</span>)}
        </div>
      )}
    </div>
  );
}
