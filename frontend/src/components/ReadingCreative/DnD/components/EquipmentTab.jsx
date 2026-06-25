import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Minus, Power, Sparkles } from 'lucide-react';
import {
  EQUIP_SLOTS, defaultSlotForKind, resolveItem, weaponAttack,
  EQUIPPABLE_KINDS, WEAPON_KINDS, KIND_LABELS,
} from '../rules/items';
import { formatMod } from '../dndUtils';
import EquipPicker from './EquipPicker';

const SLOT_OPTIONS = EQUIP_SLOTS;
const CORE_SLOTS = ['main hand', 'off hand', 'body'];
// Kinds whose quantity matters (stackable). Weapons/armor stay singular.
const STACKABLE = new Set(['ammunition', 'consumable', 'throwable', 'gear']);

export default function EquipmentTab({ character, editMode, onUpdate, itemCache = {} }) {
  const items = character.items || [];
  const abilities = character.abilities || {};
  const level = character.meta?.level || 1;
  const [expandedId, setExpandedId] = useState(null);
  const [picker, setPicker] = useState(null); // null | 'equipped' | 'carried'

  const equipped = items.filter(it => it.equipped);
  const carried = items.filter(it => !it.equipped);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const updateItem = (id, fields) =>
    onUpdate({ items: items.map(it => (it.id === id ? { ...it, ...fields } : it)) });
  const removeItem = (id) => onUpdate({ items: items.filter(it => it.id !== id) });
  const setQuantity = (id, qty) => updateItem(id, { quantity: Math.max(0, qty) });

  const addFreeform = (isEquipped) => {
    onUpdate({
      items: [...items, {
        id: Date.now(), name: '', quantity: 1, equipped: isEquipped,
        slot: isEquipped ? 'other' : 'other', notes: '',
      }],
    });
  };

  const addFromLibrary = (libItem, isEquipped) => {
    const equippable = EQUIPPABLE_KINDS.has(libItem.kind);
    const inst = {
      id: Date.now(), refType: 'item', refId: libItem.id,
      name: libItem.name, kind: libItem.kind,
      equipped: isEquipped && equippable,
      slot: defaultSlotForKind(libItem.kind),
      quantity: 1, notes: '',
    };
    if (libItem.has_charges) inst.charges = libItem.max_charges;
    if (libItem.has_toggle) inst.active = false;
    onUpdate({ items: [...items, inst] });
  };

  const toggleEquipped = (item) => {
    const base = baseOf(item);
    const equippable = !base || EQUIPPABLE_KINDS.has((base && base.kind) || item.kind);
    if (!item.equipped && !equippable) return; // can't equip ammo/consumables
    updateItem(item.id, {
      equipped: !item.equipped,
      slot: !item.equipped && (!item.slot || item.slot === 'other')
        ? defaultSlotForKind((base && base.kind) || item.kind)
        : item.slot,
    });
  };

  const baseOf = (item) => (item.refType === 'item' ? itemCache[item.refId] : null);

  // Short "what this contributes" line for the row.
  const contribution = (item) => {
    const base = baseOf(item);
    if (!base) return null;
    const r = resolveItem(item, base);
    if (WEAPON_KINDS.has(r.kind)) {
      const atk = weaponAttack(r, abilities, level, { proficient: item.proficient !== false });
      if (!atk) return null;
      const dmgMod = atk.damageMod ? formatMod(atk.damageMod) : '';
      return `${formatMod(atk.toHit)} to hit · ${atk.damageDice}${dmgMod} ${atk.damageType}`;
    }
    if (r.kind === 'armor') {
      const mb = r.magicBonus ? ` ${formatMod(r.magicBonus)}` : '';
      const dex = base.dex_cap == null ? '+DEX' : base.dex_cap === 0 ? 'no DEX' : `+DEX (max ${base.dex_cap})`;
      return `Base AC ${base.base_ac}${mb} · ${dex}`;
    }
    if (r.kind === 'shield') return `${formatMod((base.base_ac || 2) + r.magicBonus)} AC`;
    return null;
  };

  // ── Row ────────────────────────────────────────────────────────────────────
  const renderItem = (item) => {
    const isExpanded = expandedId === item.id;
    const base = baseOf(item);
    const kind = (base && base.kind) || item.kind || null;
    const isLib = item.refType === 'item';
    const displayName = item.customName || (base && base.name) || item.name || 'Unnamed';
    const contrib = contribution(item);
    const equippable = !kind || EQUIPPABLE_KINDS.has(kind);
    // Show the quantity stepper everywhere except equipped singular gear
    // (a worn weapon/armor/shield), where a count is meaningless.
    const showQty = !(isLib && item.equipped && !STACKABLE.has(kind));

    const hasCharges = base && base.has_charges;
    const maxCharges = (item.maxCharges ?? (base && base.max_charges)) || 0;
    const curCharges = item.charges ?? maxCharges;
    const setCharges = (n) => updateItem(item.id, { charges: Math.max(0, Math.min(maxCharges, n)) });

    const hasToggle = base && base.has_toggle;

    return (
      <div key={item.id} className={`dnd-equipment__item ${item.equipped ? '' : 'dnd-equipment__item--carried'}`}>
        <div className="dnd-equipment__item-row" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
          <span className={`dnd-equipment__expand-icon ${isExpanded ? 'open' : ''}`}>
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>

          {editMode && !isLib ? (
            <input className="dnd-field dnd-equipment__name-input" value={item.name}
              onChange={(e) => updateItem(item.id, { name: e.target.value })}
              placeholder="Item name" onClick={(e) => e.stopPropagation()} />
          ) : (
            <span className="dnd-equipment__item-name">
              {displayName}
              {item.attuned && <Sparkles size={11} className="dnd-equipment__attune" title="Attuned" />}
            </span>
          )}

          {kind && <span className="dnd-equipment__kind-badge">{KIND_LABELS[kind] || kind}</span>}
          {contrib && <span className="dnd-equipment__contrib">{contrib}</span>}

          {/* Charges */}
          {hasCharges && (
            <div className="dnd-equipment__charges" onClick={(e) => e.stopPropagation()} title="Charges">
              <button className="dnd-equipment__qty-btn" onClick={() => setCharges(curCharges - 1)}><Minus size={11} /></button>
              <span className="dnd-equipment__charges-val">{curCharges}/{maxCharges}</span>
              <button className="dnd-equipment__qty-btn" onClick={() => setCharges(curCharges + 1)}><Plus size={11} /></button>
            </div>
          )}

          {/* On/off toggle */}
          {hasToggle && (
            <button
              className={`dnd-equipment__power ${item.active ? 'dnd-equipment__power--on' : ''}`}
              onClick={(e) => { e.stopPropagation(); updateItem(item.id, { active: !item.active }); }}
              title={item.active ? 'On' : 'Off'}
            >
              <Power size={12} />
            </button>
          )}

          {/* Quantity */}
          {showQty && (
            <div className="dnd-equipment__qty" onClick={(e) => e.stopPropagation()}>
              <button className="dnd-equipment__qty-btn" onClick={() => setQuantity(item.id, (item.quantity || 1) - 1)} aria-label="Decrease quantity"><Minus size={11} /></button>
              <input type="number" className="dnd-equipment__qty-num" value={item.quantity ?? 1} min={0}
                onChange={(e) => setQuantity(item.id, parseInt(e.target.value) || 0)} />
              <button className="dnd-equipment__qty-btn" onClick={() => setQuantity(item.id, (item.quantity || 1) + 1)} aria-label="Increase quantity"><Plus size={11} /></button>
            </div>
          )}

          {/* Equip toggle (equippable only) */}
          {equippable && (
            <button
              className={`dnd-equipment__equip-toggle ${item.equipped ? 'dnd-equipment__equip-toggle--on' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggleEquipped(item); }}
              title={item.equipped ? 'Unequip' : 'Equip'}
            >
              {item.equipped ? 'Equipped' : 'Equip'}
            </button>
          )}

          {editMode && (
            <button className="dnd-equipment__remove" onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}>
              <Trash2 size={12} />
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="dnd-equipment__item-notes">
            {isLib ? renderInstanceEditor(item, base) : (
              editMode ? (
                <textarea className="dnd-field dnd-equipment__notes-input" value={item.notes || ''}
                  onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                  placeholder="Properties, magical effects, attunement, AC contribution…" rows={3} />
              ) : (
                <p className="dnd-equipment__notes-text">{item.notes || 'No notes'}</p>
              )
            )}
          </div>
        )}
      </div>
    );
  };

  // Expanded editor for a library-backed instance (per-character overrides).
  const renderInstanceEditor = (item, base) => {
    const kind = (base && base.kind) || item.kind;
    const isWeapon = WEAPON_KINDS.has(kind);
    const isDefensive = kind === 'armor' || kind === 'shield';
    const set = (fields) => updateItem(item.id, fields);
    return (
      <div className="dnd-equipment__editor">
        <div className="dnd-equipment__editor-grid">
          <label className="dnd-equipment__field">
            <span>Custom name</span>
            <input className="dnd-field" value={item.customName || ''}
              placeholder={base?.name || ''} onChange={(e) => set({ customName: e.target.value })} />
          </label>
          {(isWeapon || isDefensive) && (
            <label className="dnd-equipment__field">
              <span>Magic bonus</span>
              <input type="number" className="dnd-field" value={item.magicBonus ?? ''}
                placeholder="0" onChange={(e) => set({ magicBonus: parseInt(e.target.value) || 0 })} />
            </label>
          )}
          {isWeapon && (
            <label className="dnd-equipment__field">
              <span>Ability</span>
              <select className="dnd-field" value={item.abilityOverride || ''}
                onChange={(e) => set({ abilityOverride: e.target.value || undefined })}>
                <option value="">Auto</option>
                <option value="STR">STR</option>
                <option value="DEX">DEX</option>
              </select>
            </label>
          )}
          {item.equipped && (
            <label className="dnd-equipment__field">
              <span>Slot</span>
              <select className="dnd-field" value={item.slot || 'other'}
                onChange={(e) => set({ slot: e.target.value })}>
                {SLOT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          )}
          {base?.has_charges && (
            <label className="dnd-equipment__field">
              <span>Max charges</span>
              <input type="number" className="dnd-field" value={item.maxCharges ?? base.max_charges}
                onChange={(e) => set({ maxCharges: parseInt(e.target.value) || 0 })} />
            </label>
          )}
        </div>
        <div className="dnd-equipment__editor-row">
          <label className="dnd-equipment__check">
            <input type="checkbox" checked={!!item.attuned}
              onChange={(e) => set({ attuned: e.target.checked })} /> Attuned
          </label>
          {isWeapon && (
            <label className="dnd-equipment__check">
              <input type="checkbox" checked={item.proficient !== false}
                onChange={(e) => set({ proficient: e.target.checked })} /> Proficient
            </label>
          )}
          <input className="dnd-field dnd-equipment__bonusprops" value={item.bonusProperties || ''}
            placeholder="Extra properties (comma separated)"
            onChange={(e) => set({ bonusProperties: e.target.value })} />
        </div>
        <textarea className="dnd-field dnd-equipment__notes-input" value={item.notes || ''}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Notes — origin, lore, effects…" rows={2} />
        {base?.description && <p className="dnd-equipment__basedesc">{base.description}</p>}
      </div>
    );
  };

  // ── Equipped slot grouping ───────────────────────────────────────────────────
  const bySlot = {};
  equipped.forEach(it => { const s = it.slot || 'other'; (bySlot[s] ||= []).push(it); });
  const slotsToRender = SLOT_OPTIONS.filter(s => CORE_SLOTS.includes(s) || (bySlot[s] && bySlot[s].length));

  return (
    <div className="dnd-equipment">
      {/* Equipped */}
      <div className="dnd-equipment__section">
        <div className="dnd-equipment__section-header">
          <h3 className="dnd-equipment__section-title">Equipped</h3>
          <div className="dnd-equipment__add-group">
            <button className="dnd-equipment__add" onClick={() => setPicker('equipped')}><Plus size={14} /> Library</button>
            <button className="dnd-equipment__add" onClick={() => addFreeform(true)}><Plus size={14} /> Custom</button>
          </div>
        </div>
        {slotsToRender.map(slot => (
          <div key={slot} className="dnd-equipment__slot-group">
            <div className="dnd-equipment__slot-label">{slot}</div>
            {(bySlot[slot] || []).map(renderItem)}
            {!(bySlot[slot] || []).length && <div className="dnd-equipment__slot-empty">— empty —</div>}
          </div>
        ))}
      </div>

      {/* Carried */}
      <div className="dnd-equipment__section">
        <div className="dnd-equipment__section-header">
          <h3 className="dnd-equipment__section-title">Carried</h3>
          <div className="dnd-equipment__add-group">
            <button className="dnd-equipment__add" onClick={() => setPicker('carried')}><Plus size={14} /> Library</button>
            <button className="dnd-equipment__add" onClick={() => addFreeform(false)}><Plus size={14} /> Custom</button>
          </div>
        </div>
        {carried.length === 0 && <p className="dnd-equipment__empty">No carried items</p>}
        {carried.map(renderItem)}
      </div>

      {/* Coins */}
      <div className="dnd-equipment__section">
        <h3 className="dnd-equipment__section-title">Coins</h3>
        <div className="dnd-coins">
          {['CP', 'SP', 'EP', 'GP', 'PP'].map(type => {
            const current = (character.coins || {})[type] || 0;
            const setCoins = (val) => onUpdate({ coins: { ...(character.coins || {}), [type]: Math.max(0, val) } });
            return (
              <div key={type} className="dnd-coins__cell">
                <span className="dnd-coins__label">{type}</span>
                <div className="dnd-coins__value">
                  <button onClick={() => setCoins(current - 1)} aria-label={`Decrease ${type}`}>-</button>
                  <input type="number" className="dnd-coins__input" value={current} min={0}
                    onChange={(e) => setCoins(parseInt(e.target.value) || 0)} />
                  <button onClick={() => setCoins(current + 1)} aria-label={`Increase ${type}`}>+</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {picker && (
        <EquipPicker
          onClose={() => setPicker(null)}
          onPick={(libItem) => addFromLibrary(libItem, picker === 'equipped')}
        />
      )}
    </div>
  );
}
