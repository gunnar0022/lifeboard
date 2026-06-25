import { ITEM_KINDS, KIND_LABELS, WEAPON_PROPERTIES, WEAPON_KINDS } from '../../rules/items';

const DAMAGE_TYPES = [
  'slashing', 'piercing', 'bludgeoning', 'fire', 'cold', 'lightning',
  'acid', 'poison', 'necrotic', 'radiant', 'thunder', 'force', 'psychic',
];
const RARITIES = ['common', 'uncommon', 'rare', 'very rare', 'legendary', 'artifact'];
const RECHARGE_ON = [
  { id: 'dawn', label: 'At dawn' },
  { id: 'long', label: 'Long rest' },
  { id: 'short', label: 'Short or long rest' },
  { id: 'manual', label: 'Manual only' },
];

/** A blank draft with every column the API expects. */
export function blankItemDraft(kind = 'gear') {
  return {
    name: '', kind, subtype: '', rarity: 'common', description: '',
    properties: [], damage_dice: '', damage_type: 'slashing', versatile_dice: '',
    weapon_range: '', range_normal: '', default_ability: '',
    base_ac: '', dex_cap: '', strength_req: 0, stealth_disadvantage: false,
    has_charges: false, max_charges: 0, recharge: { on: 'dawn', amount: 'all' },
    has_toggle: false, weight: 0, cost: '', source: 'PHB', data: {},
  };
}

/** Normalize a draft (empty strings → null for nullable numerics) for the API. */
export function itemDraftToPayload(d) {
  const numOrNull = (v) => (v === '' || v == null ? null : Number(v));
  return {
    ...d,
    base_ac: numOrNull(d.base_ac),
    dex_cap: numOrNull(d.dex_cap),
    strength_req: Number(d.strength_req) || 0,
    max_charges: Number(d.max_charges) || 0,
    weight: Number(d.weight) || 0,
    recharge: d.has_charges ? d.recharge : null,
    damage_dice: d.damage_dice || null,
    versatile_dice: d.versatile_dice || null,
    range_normal: d.range_normal || null,
    default_ability: d.default_ability || null,
  };
}

/** Hydrate an API row into an editable draft. */
export function itemToDraft(item) {
  const d = blankItemDraft(item.kind || 'gear');
  return {
    ...d, ...item,
    base_ac: item.base_ac == null ? '' : item.base_ac,
    dex_cap: item.dex_cap == null ? '' : item.dex_cap,
    properties: item.properties || [],
    stealth_disadvantage: !!item.stealth_disadvantage,
    has_charges: !!item.has_charges,
    has_toggle: !!item.has_toggle,
    recharge: item.recharge || { on: 'dawn', amount: 'all' },
    data: item.data || {},
  };
}

/**
 * Kind-aware item editor. Controlled — owns nothing; parent holds the draft.
 * Reuses the spell-modal form styling so it drops into the create modal and the
 * detail-view edit panel alike.
 */
export default function ItemForm({ draft, onChange }) {
  const set = (fields) => onChange({ ...draft, ...fields });
  const isWeapon = WEAPON_KINDS.has(draft.kind);
  const isArmor = draft.kind === 'armor';
  const isShield = draft.kind === 'shield';

  const toggleProp = (p) => set({
    properties: draft.properties.includes(p)
      ? draft.properties.filter(x => x !== p)
      : [...draft.properties, p],
  });

  return (
    <div className="spell-modal__create-form">
      <div className="spell-modal__form-row">
        <div className="spell-modal__form-field spell-modal__form-field--wide">
          <label>Name *</label>
          <input className="dnd-field" value={draft.name} onChange={e => set({ name: e.target.value })} />
        </div>
        <div className="spell-modal__form-field">
          <label>Kind</label>
          <select className="dnd-field" value={draft.kind} onChange={e => set({ kind: e.target.value })}>
            {ITEM_KINDS.map(k => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
          </select>
        </div>
      </div>

      <div className="spell-modal__form-row">
        <div className="spell-modal__form-field">
          <label>Subtype</label>
          <input className="dnd-field" value={draft.subtype} placeholder="simple / martial / potion / wand…"
            onChange={e => set({ subtype: e.target.value })} />
        </div>
        <div className="spell-modal__form-field">
          <label>Rarity</label>
          <select className="dnd-field" value={draft.rarity} onChange={e => set({ rarity: e.target.value })}>
            {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="spell-modal__form-field">
          <label>Source</label>
          <input className="dnd-field" value={draft.source} onChange={e => set({ source: e.target.value })} />
        </div>
      </div>

      {/* Weapon fields */}
      {isWeapon && (
        <>
          <div className="spell-modal__form-row">
            <div className="spell-modal__form-field">
              <label>Damage</label>
              <input className="dnd-field" value={draft.damage_dice} placeholder="1d8"
                onChange={e => set({ damage_dice: e.target.value })} />
            </div>
            <div className="spell-modal__form-field">
              <label>Damage Type</label>
              <select className="dnd-field" value={draft.damage_type} onChange={e => set({ damage_type: e.target.value })}>
                {DAMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="spell-modal__form-field">
              <label>Versatile</label>
              <input className="dnd-field" value={draft.versatile_dice} placeholder="1d10"
                onChange={e => set({ versatile_dice: e.target.value })} />
            </div>
          </div>
          <div className="spell-modal__form-row">
            <div className="spell-modal__form-field">
              <label>Range (ft)</label>
              <input className="dnd-field" value={draft.range_normal} placeholder="20/60"
                onChange={e => set({ range_normal: e.target.value })} />
            </div>
            <div className="spell-modal__form-field">
              <label>Forced Ability</label>
              <select className="dnd-field" value={draft.default_ability} onChange={e => set({ default_ability: e.target.value })}>
                <option value="">Auto (finesse = best)</option>
                <option value="STR">STR</option>
                <option value="DEX">DEX</option>
              </select>
            </div>
          </div>
          <div className="spell-modal__form-field spell-modal__form-field--full">
            <label>Properties</label>
            <div className="spell-modal__tags">
              {WEAPON_PROPERTIES.map(p => (
                <button key={p} type="button"
                  className={`spell-tag ${draft.properties.includes(p) ? 'spell-tag--on' : ''}`}
                  onClick={() => toggleProp(p)}>{p}</button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Armor fields */}
      {isArmor && (
        <div className="spell-modal__form-row">
          <div className="spell-modal__form-field">
            <label>Base AC</label>
            <input type="number" className="dnd-field" value={draft.base_ac}
              onChange={e => set({ base_ac: e.target.value })} />
          </div>
          <div className="spell-modal__form-field">
            <label>Dex Cap</label>
            <input type="number" className="dnd-field" value={draft.dex_cap} placeholder="blank = none"
              onChange={e => set({ dex_cap: e.target.value })} />
          </div>
          <div className="spell-modal__form-field">
            <label>STR Req</label>
            <input type="number" className="dnd-field" value={draft.strength_req}
              onChange={e => set({ strength_req: e.target.value })} />
          </div>
          <label className="spell-modal__checkbox">
            <input type="checkbox" checked={draft.stealth_disadvantage}
              onChange={e => set({ stealth_disadvantage: e.target.checked })} />
            Stealth disadv.
          </label>
        </div>
      )}

      {isShield && (
        <div className="spell-modal__form-row">
          <div className="spell-modal__form-field">
            <label>AC Bonus</label>
            <input type="number" className="dnd-field" value={draft.base_ac} placeholder="2"
              onChange={e => set({ base_ac: e.target.value })} />
          </div>
        </div>
      )}

      <div className="spell-modal__form-field spell-modal__form-field--full">
        <label>Description</label>
        <textarea className="dnd-field dnd-field--textarea" rows={3} value={draft.description}
          onChange={e => set({ description: e.target.value })} />
      </div>

      <div className="spell-modal__form-row">
        <div className="spell-modal__form-field">
          <label>Weight</label>
          <input type="number" className="dnd-field" value={draft.weight}
            onChange={e => set({ weight: e.target.value })} />
        </div>
        <div className="spell-modal__form-field">
          <label>Cost</label>
          <input className="dnd-field" value={draft.cost} placeholder="15 gp"
            onChange={e => set({ cost: e.target.value })} />
        </div>
      </div>

      {/* Charges & toggle */}
      <div className="spell-modal__form-row">
        <label className="spell-modal__checkbox">
          <input type="checkbox" checked={draft.has_charges}
            onChange={e => set({ has_charges: e.target.checked })} />
          Has charges
        </label>
        <label className="spell-modal__checkbox">
          <input type="checkbox" checked={draft.has_toggle}
            onChange={e => set({ has_toggle: e.target.checked })} />
          On/off toggle
        </label>
      </div>
      {draft.has_charges && (
        <div className="spell-modal__form-row">
          <div className="spell-modal__form-field">
            <label>Max charges</label>
            <input type="number" className="dnd-field" value={draft.max_charges}
              onChange={e => set({ max_charges: e.target.value })} />
          </div>
          <div className="spell-modal__form-field">
            <label>Recharges</label>
            <select className="dnd-field" value={draft.recharge.on}
              onChange={e => set({ recharge: { ...draft.recharge, on: e.target.value } })}>
              {RECHARGE_ON.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <div className="spell-modal__form-field">
            <label>Amount</label>
            <input className="dnd-field" value={draft.recharge.amount} placeholder="all / 1d6+1"
              onChange={e => set({ recharge: { ...draft.recharge, amount: e.target.value } })} />
          </div>
        </div>
      )}
    </div>
  );
}
