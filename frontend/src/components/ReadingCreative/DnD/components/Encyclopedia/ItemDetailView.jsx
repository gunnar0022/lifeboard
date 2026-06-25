import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { KIND_LABELS } from '../../rules/items';
import ItemForm, { itemToDraft, itemDraftToPayload } from './ItemForm';
import Mech from './Mech';

/**
 * Full item readout — the deepest frame on the items branch. Fetches the row on
 * demand. In edit mode the row is directly editable (PUT) and deletable, so the
 * Encyclopedia is the central place to curate the shared armory.
 */
export default function ItemDetailView({ itemId, preview, editMode, onDeleted }) {
  const [item, setItem] = useState(preview || null);
  const [loading, setLoading] = useState(!preview);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/dnd/items/${itemId}`)
      .then(r => r.json())
      .then(it => { if (alive) setItem(it); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [itemId]);

  if (!item) return <div className="wiki-detail">{loading ? 'Loading item…' : 'Item not found.'}</div>;

  const startEdit = () => { setDraft(itemToDraft(item)); setEditing(true); };

  const save = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dnd/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemDraftToPayload(draft)),
      });
      setItem(await res.json());
      setEditing(false);
    } catch (e) {
      console.error('Update item failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${item.name}" from the library?`)) return;
    try {
      await fetch(`/api/dnd/items/${itemId}`, { method: 'DELETE' });
      onDeleted && onDeleted();
    } catch (e) {
      console.error('Delete item failed:', e);
    }
  };

  if (editing && draft) {
    return (
      <div className="wiki-detail">
        <h2 className="wiki-detail__name">Editing {item.name}</h2>
        <ItemForm draft={draft} onChange={setDraft} />
        <div className="spell-modal__form-actions">
          <button className="dnd-add-btn" onClick={() => setEditing(false)}>Cancel</button>
          <button className="spell-modal__submit" onClick={save} disabled={saving || !draft.name.trim()}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  const meta = [];
  if (item.damage_dice) meta.push(['Damage', `${item.damage_dice}${item.damage_type ? ` ${item.damage_type}` : ''}`, 'mech mech--dice']);
  if (item.versatile_dice) meta.push(['Versatile', item.versatile_dice, 'mech mech--dice']);
  if (item.range_normal) meta.push(['Range', `${item.range_normal} ft`]);
  if (item.base_ac != null) meta.push([item.kind === 'shield' ? 'AC Bonus' : 'Base AC', item.kind === 'shield' ? `+${item.base_ac}` : item.base_ac, 'mech mech--num']);
  if (item.dex_cap != null) meta.push(['Dex Cap', `+${item.dex_cap}`]);
  if (item.strength_req) meta.push(['STR Req', item.strength_req]);
  if (item.has_charges) meta.push(['Charges', `${item.max_charges}${item.recharge ? ` · ${item.recharge.amount} ${item.recharge.on}` : ''}`]);
  if (item.weight) meta.push(['Weight', `${item.weight} lb`]);
  if (item.cost) meta.push(['Cost', item.cost]);

  return (
    <div className="wiki-detail">
      <header className="wiki-detail__hero">
        <span className="wiki-detail__kicker">
          {KIND_LABELS[item.kind] || item.kind}{item.subtype ? ` · ${item.subtype}` : ''} · {item.rarity}
        </span>
        <h2 className="wiki-detail__name">{item.name}</h2>
        <div className="wiki-spell-flags">
          {(item.properties || []).map(p => <span key={p} className="wiki-flag">{p}</span>)}
          {item.stealth_disadvantage ? <span className="wiki-flag">stealth disadv.</span> : null}
          {item.has_toggle ? <span className="wiki-flag">on/off</span> : null}
        </div>
        {editMode && (
          <div className="wiki-item__actions">
            <button className="dnd-add-btn" onClick={startEdit}><Pencil size={13} /> Edit</button>
            <button className="dnd-equipment__remove" onClick={remove}><Trash2 size={14} /></button>
          </div>
        )}
      </header>

      {meta.length > 0 && (
        <div className="wiki-spellmeta">
          {meta.map(([k, v, cls]) => (
            <div key={k} className="wiki-spellmeta__cell">
              <span className="wiki-spellmeta__k">{k}</span>
              <span className={`wiki-spellmeta__v ${cls || ''}`}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {item.description && (
        <section className="wiki-section">
          <p className="wiki-detail__overview"><Mech text={item.description} /></p>
        </section>
      )}
    </div>
  );
}
