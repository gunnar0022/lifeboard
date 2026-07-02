import { Plus, Trash2 } from 'lucide-react';
import { ABILITIES, SUMMON_CATEGORIES, SUMMON_SIZES } from '../../rules/shared/summons';

const SPEED_MODES = ['walk', 'fly', 'swim', 'climb', 'burrow'];

/**
 * Full stat-block editor for a summon. Controlled — the parent owns the draft
 * (blankSummonDraft() shape, same as the /api/dnd/summons columns). Used both to
 * author a library template and to edit a live instance's snapshot in place.
 * Reuses the spell/item modal form styling (spell-modal__*).
 */
export default function SummonForm({ draft, onChange }) {
  const set = (fields) => onChange({ ...draft, ...fields });
  const setSpeed = (mode, val) => {
    const speeds = { ...(draft.speeds || {}) };
    if (val === '' || val == null) delete speeds[mode];
    else speeds[mode] = Number(val) || 0;
    set({ speeds });
  };
  const setAbility = (ab, val) =>
    set({ ability_scores: { ...(draft.ability_scores || {}), [ab]: Number(val) || 0 } });

  // Generic editable list of {name, desc, ...} rows (traits / actions / reactions).
  const editList = (key, blankRow) => ({
    rows: draft[key] || [],
    add: () => set({ [key]: [...(draft[key] || []), blankRow()] }),
    remove: (i) => set({ [key]: (draft[key] || []).filter((_, idx) => idx !== i) }),
    update: (i, fields) => set({
      [key]: (draft[key] || []).map((r, idx) => (idx === i ? { ...r, ...fields } : r)),
    }),
  });
  const traits = editList('traits', () => ({ name: '', desc: '' }));
  const actions = editList('actions', () => ({ name: '', toHit: '', damage: '', range: '', desc: '' }));
  const reactions = editList('reactions', () => ({ name: '', desc: '' }));

  return (
    <div className="spell-modal__create-form">
      {/* Identity */}
      <div className="spell-modal__form-row">
        <div className="spell-modal__form-field spell-modal__form-field--wide">
          <label>Name *</label>
          <input className="dnd-field" value={draft.name} onChange={e => set({ name: e.target.value })} />
        </div>
        <div className="spell-modal__form-field">
          <label>Category</label>
          <select className="dnd-field" value={draft.category} onChange={e => set({ category: e.target.value })}>
            {SUMMON_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div className="spell-modal__form-row">
        <div className="spell-modal__form-field">
          <label>Size</label>
          <select className="dnd-field" value={draft.size} onChange={e => set({ size: e.target.value })}>
            {SUMMON_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="spell-modal__form-field">
          <label>Creature Type</label>
          <input className="dnd-field" value={draft.creature_type} placeholder="beast, elemental, fey…"
            onChange={e => set({ creature_type: e.target.value })} />
        </div>
        <div className="spell-modal__form-field">
          <label>CR</label>
          <input className="dnd-field" value={draft.cr} placeholder="1/4"
            onChange={e => set({ cr: e.target.value })} />
        </div>
      </div>

      <div className="spell-modal__form-row">
        <div className="spell-modal__form-field">
          <label>Source Spell / Origin</label>
          <input className="dnd-field" value={draft.source_spell} placeholder="Conjure Animals"
            onChange={e => set({ source_spell: e.target.value })} />
        </div>
        <div className="spell-modal__form-field">
          <label>Source</label>
          <input className="dnd-field" value={draft.source} onChange={e => set({ source: e.target.value })} />
        </div>
        <label className="spell-modal__checkbox">
          <input type="checkbox" checked={!!draft.requires_concentration}
            onChange={e => set({ requires_concentration: e.target.checked })} />
          Requires concentration
        </label>
      </div>

      {/* Defenses */}
      <div className="spell-modal__form-row">
        <div className="spell-modal__form-field">
          <label>AC</label>
          <input type="number" className="dnd-field" value={draft.ac}
            onChange={e => set({ ac: e.target.value })} />
        </div>
        <div className="spell-modal__form-field spell-modal__form-field--wide">
          <label>AC Note</label>
          <input className="dnd-field" value={draft.ac_note} placeholder="natural armor / 11 + spell level"
            onChange={e => set({ ac_note: e.target.value })} />
        </div>
        <div className="spell-modal__form-field">
          <label>Max HP</label>
          <input type="number" className="dnd-field" value={draft.hp}
            onChange={e => set({ hp: e.target.value })} />
        </div>
      </div>

      <div className="spell-modal__form-row">
        <div className="spell-modal__form-field">
          <label>HP Formula</label>
          <input className="dnd-field" value={draft.hp_formula} placeholder="2d8 + 2"
            onChange={e => set({ hp_formula: e.target.value })} />
        </div>
        <div className="spell-modal__form-field">
          <label>Hit Dice</label>
          <input className="dnd-field" value={draft.hit_dice} placeholder="2d8+2"
            onChange={e => set({ hit_dice: e.target.value })} />
        </div>
        <div className="spell-modal__form-field">
          <label>Saving Throws</label>
          <input className="dnd-field" value={draft.saves} placeholder="Dex +4, Con +2"
            onChange={e => set({ saves: e.target.value })} />
        </div>
      </div>

      <div className="spell-modal__form-row">
        <div className="spell-modal__form-field">
          <label>Resistances</label>
          <input className="dnd-field" value={draft.resistances}
            onChange={e => set({ resistances: e.target.value })} />
        </div>
        <div className="spell-modal__form-field">
          <label>Immunities</label>
          <input className="dnd-field" value={draft.immunities}
            onChange={e => set({ immunities: e.target.value })} />
        </div>
        <div className="spell-modal__form-field">
          <label>Vulnerabilities</label>
          <input className="dnd-field" value={draft.vulnerabilities}
            onChange={e => set({ vulnerabilities: e.target.value })} />
        </div>
        <div className="spell-modal__form-field">
          <label>Condition Immunities</label>
          <input className="dnd-field" value={draft.condition_immunities}
            onChange={e => set({ condition_immunities: e.target.value })} />
        </div>
      </div>

      {/* Speeds */}
      <div className="spell-modal__form-field spell-modal__form-field--full">
        <label>Speeds (ft.)</label>
        <div className="dnd-summon-form__speeds">
          {SPEED_MODES.map(mode => (
            <div key={mode} className="dnd-summon-form__speed">
              <span>{mode}</span>
              <input type="number" className="dnd-field" value={draft.speeds?.[mode] ?? ''}
                onChange={e => setSpeed(mode, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Ability scores */}
      <div className="spell-modal__form-field spell-modal__form-field--full">
        <label>Ability Scores</label>
        <div className="dnd-summon-form__abilities">
          {ABILITIES.map(ab => (
            <div key={ab} className="dnd-summon-form__ability">
              <span>{ab}</span>
              <input type="number" className="dnd-field" value={draft.ability_scores?.[ab] ?? 10}
                onChange={e => setAbility(ab, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="spell-modal__form-row">
        <div className="spell-modal__form-field">
          <label>Skills</label>
          <input className="dnd-field" value={draft.skills} placeholder="Perception +3, Stealth +4"
            onChange={e => set({ skills: e.target.value })} />
        </div>
        <div className="spell-modal__form-field">
          <label>Senses</label>
          <input className="dnd-field" value={draft.senses} placeholder="darkvision 60 ft."
            onChange={e => set({ senses: e.target.value })} />
        </div>
        <div className="spell-modal__form-field">
          <label>Languages</label>
          <input className="dnd-field" value={draft.languages}
            onChange={e => set({ languages: e.target.value })} />
        </div>
      </div>

      {/* Traits */}
      <ListEditor title="Traits" onAdd={traits.add}>
        {traits.rows.map((t, i) => (
          <div key={i} className="dnd-summon-form__row">
            <input className="dnd-field" value={t.name} placeholder="Trait name"
              onChange={e => traits.update(i, { name: e.target.value })} />
            <textarea className="dnd-field dnd-field--textarea" rows={2} value={t.desc} placeholder="Description"
              onChange={e => traits.update(i, { desc: e.target.value })} />
            <button className="dnd-summon-form__del" onClick={() => traits.remove(i)}><Trash2 size={13} /></button>
          </div>
        ))}
      </ListEditor>

      {/* Actions */}
      <ListEditor title="Actions" onAdd={actions.add}>
        {actions.rows.map((a, i) => (
          <div key={i} className="dnd-summon-form__row dnd-summon-form__row--action">
            <div className="dnd-summon-form__action-grid">
              <input className="dnd-field" value={a.name} placeholder="Name"
                onChange={e => actions.update(i, { name: e.target.value })} />
              <input className="dnd-field" value={a.toHit} placeholder="To hit (+4)"
                onChange={e => actions.update(i, { toHit: e.target.value })} />
              <input className="dnd-field" value={a.damage} placeholder="Damage (2d4 + 2 piercing)"
                onChange={e => actions.update(i, { damage: e.target.value })} />
              <input className="dnd-field" value={a.range} placeholder="Range (Melee, 5 ft.)"
                onChange={e => actions.update(i, { range: e.target.value })} />
            </div>
            <textarea className="dnd-field dnd-field--textarea" rows={2} value={a.desc} placeholder="Effect / rider"
              onChange={e => actions.update(i, { desc: e.target.value })} />
            <button className="dnd-summon-form__del" onClick={() => actions.remove(i)}><Trash2 size={13} /></button>
          </div>
        ))}
      </ListEditor>

      {/* Reactions */}
      <ListEditor title="Reactions" onAdd={reactions.add}>
        {reactions.rows.map((r, i) => (
          <div key={i} className="dnd-summon-form__row">
            <input className="dnd-field" value={r.name} placeholder="Reaction name"
              onChange={e => reactions.update(i, { name: e.target.value })} />
            <textarea className="dnd-field dnd-field--textarea" rows={2} value={r.desc} placeholder="Description"
              onChange={e => reactions.update(i, { desc: e.target.value })} />
            <button className="dnd-summon-form__del" onClick={() => reactions.remove(i)}><Trash2 size={13} /></button>
          </div>
        ))}
      </ListEditor>

      <div className="spell-modal__form-field spell-modal__form-field--full">
        <label>Description / Notes</label>
        <textarea className="dnd-field dnd-field--textarea" rows={3} value={draft.description}
          onChange={e => set({ description: e.target.value })} />
      </div>
    </div>
  );
}

function ListEditor({ title, onAdd, children }) {
  return (
    <div className="dnd-summon-form__list">
      <div className="dnd-summon-form__list-head">
        <span>{title}</span>
        <button className="dnd-summon-form__add" onClick={onAdd}><Plus size={13} /> Add</button>
      </div>
      {children}
    </div>
  );
}
