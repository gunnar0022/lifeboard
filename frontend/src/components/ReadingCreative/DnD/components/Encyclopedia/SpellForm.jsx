import { SCALING_KINDS } from '../../spellSlots';
import { SPELL_CLASS_TAGS, parseSpellClasses } from '../Spellcasting/spellTags';

const SPELL_TYPE_OPTIONS = ['damage', 'healing', 'buff', 'debuff', 'utility', 'control'];
const SAVE_OPTIONS = ['', 'STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export function blankSpellDraft() {
  return {
    name: '', level: 0, casting_time: '1 action', range: '', aoe: '',
    duration: 'Instantaneous', concentration: false, ritual: false, components: '',
    spell_type: 'utility', damage: '', save_type: '', save_effect: '',
    description: '', upcast: '', scaling_kind: '', scaling_per_level: '',
    classes: [], source: 'Homebrew',
  };
}

export function spellToDraft(spell) {
  return {
    name: spell.name || '', level: spell.level || 0,
    casting_time: spell.casting_time || '1 action', range: spell.range || '',
    aoe: spell.aoe || '', duration: spell.duration || 'Instantaneous',
    concentration: !!spell.concentration, ritual: !!spell.ritual,
    components: spell.components || '', spell_type: spell.spell_type || 'utility',
    damage: spell.damage || '', save_type: spell.save_type || '',
    save_effect: spell.save_effect || '', description: spell.description || '',
    upcast: spell.upcast || '', scaling_kind: spell.scaling_kind || '',
    scaling_per_level: spell.scaling_per_level || '',
    classes: parseSpellClasses(spell.classes), source: spell.source || 'PHB',
  };
}

export function spellDraftToPayload(draft) {
  return { ...draft, name: draft.name.trim(), level: Number(draft.level) || 0 };
}

/** Shared spell editor — used by the create modal and the detail-edit screen. */
export default function SpellForm({ draft, onChange }) {
  const set = (patch) => onChange({ ...draft, ...patch });
  const toggleClass = (id) => set({
    classes: draft.classes.includes(id) ? draft.classes.filter(c => c !== id) : [...draft.classes, id],
  });

  return (
    <div className="spell-modal__create-form">
      <div className="spell-modal__form-row">
        <div className="spell-modal__form-field spell-modal__form-field--wide">
          <label>Name *</label>
          <input className="dnd-field" value={draft.name} onChange={e => set({ name: e.target.value })} />
        </div>
        <div className="spell-modal__form-field">
          <label>Level</label>
          <input type="number" className="dnd-field" value={draft.level} min={0} max={9}
            onChange={e => set({ level: parseInt(e.target.value) || 0 })} />
        </div>
      </div>

      <div className="spell-modal__form-row">
        <div className="spell-modal__form-field">
          <label>Casting Time</label>
          <input className="dnd-field" value={draft.casting_time} onChange={e => set({ casting_time: e.target.value })} />
        </div>
        <div className="spell-modal__form-field">
          <label>Range</label>
          <input className="dnd-field" value={draft.range} onChange={e => set({ range: e.target.value })} />
        </div>
        <div className="spell-modal__form-field">
          <label>AOE</label>
          <input className="dnd-field" value={draft.aoe} onChange={e => set({ aoe: e.target.value })} placeholder="Optional" />
        </div>
      </div>

      <div className="spell-modal__form-row">
        <div className="spell-modal__form-field">
          <label>Duration</label>
          <input className="dnd-field" value={draft.duration} onChange={e => set({ duration: e.target.value })} />
        </div>
        <div className="spell-modal__form-field">
          <label>Components</label>
          <input className="dnd-field" value={draft.components} onChange={e => set({ components: e.target.value })} placeholder="V, S, M (...)" />
        </div>
      </div>

      <div className="spell-modal__form-row">
        <label className="spell-modal__checkbox">
          <input type="checkbox" checked={draft.concentration} onChange={e => set({ concentration: e.target.checked })} />
          Concentration
        </label>
        <label className="spell-modal__checkbox">
          <input type="checkbox" checked={draft.ritual} onChange={e => set({ ritual: e.target.checked })} />
          Ritual
        </label>
        <div className="spell-modal__form-field">
          <label>Type</label>
          <select className="dnd-field" value={draft.spell_type} onChange={e => set({ spell_type: e.target.value })}>
            {SPELL_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="spell-modal__form-row">
        <div className="spell-modal__form-field">
          <label>Damage</label>
          <input className="dnd-field" value={draft.damage} onChange={e => set({ damage: e.target.value })} placeholder="e.g. 2d6 fire" />
        </div>
        <div className="spell-modal__form-field">
          <label>Save Type</label>
          <select className="dnd-field" value={draft.save_type} onChange={e => set({ save_type: e.target.value })}>
            {SAVE_OPTIONS.map(s => <option key={s} value={s}>{s || 'None'}</option>)}
          </select>
        </div>
        <div className="spell-modal__form-field">
          <label>Save Effect</label>
          <input className="dnd-field" value={draft.save_effect} onChange={e => set({ save_effect: e.target.value })} placeholder="e.g. half damage" />
        </div>
      </div>

      <div className="spell-modal__form-field spell-modal__form-field--full">
        <label>Description *</label>
        <textarea className="dnd-field dnd-field--textarea" rows={3} value={draft.description}
          onChange={e => set({ description: e.target.value })} />
      </div>

      <div className="spell-modal__form-field spell-modal__form-field--full">
        <label>At Higher Levels</label>
        <input className="dnd-field" value={draft.upcast} onChange={e => set({ upcast: e.target.value })} placeholder="Optional text" />
      </div>

      <div className="spell-modal__form-row">
        <div className="spell-modal__form-field">
          <label>Scales by</label>
          <select className="dnd-field" value={draft.scaling_kind} onChange={e => set({ scaling_kind: e.target.value })}>
            {SCALING_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
        </div>
        <div className="spell-modal__form-field">
          <label>Per slot level</label>
          <input className="dnd-field" value={draft.scaling_per_level} onChange={e => set({ scaling_per_level: e.target.value })} placeholder="e.g. 1d6 or 1" />
        </div>
      </div>

      <div className="spell-modal__form-field spell-modal__form-field--full">
        <label>Class Tags * <span className="spell-modal__tag-hint">(which classes can cast this — pick at least one)</span></label>
        <div className="spell-modal__tags">
          {SPELL_CLASS_TAGS.map(t => (
            <button key={t.id} type="button"
              className={`spell-tag ${draft.classes.includes(t.id) ? 'spell-tag--on' : ''}`}
              onClick={() => toggleClass(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
