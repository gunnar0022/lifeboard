import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical, Minus } from 'lucide-react';

const SLOT_OPTIONS = [
  'armor', 'shield', 'main hand', 'off hand', 'cloak', 'amulet',
  'ring', 'boots', 'gloves', 'focus', 'other',
];

export default function EquipmentTab({ character, editMode, onUpdate }) {
  const items = character.items || [];
  const equipped = items.filter(it => it.equipped);
  const carried = items.filter(it => !it.equipped);
  const [expandedId, setExpandedId] = useState(null);
  const [dragFromId, setDragFromId] = useState(null);

  // --- Item CRUD (id-based, single unified list) ---
  const addItem = (isEquipped) => {
    onUpdate({
      items: [...items, {
        id: Date.now(),
        name: '',
        quantity: 1,
        equipped: isEquipped,
        slot: isEquipped ? 'armor' : 'other',
        notes: '',
      }],
    });
  };

  const updateItem = (id, fields) => {
    onUpdate({ items: items.map(it => it.id === id ? { ...it, ...fields } : it) });
  };

  const removeItem = (id) => {
    onUpdate({ items: items.filter(it => it.id !== id) });
  };

  const setQuantity = (id, qty) => {
    updateItem(id, { quantity: Math.max(1, qty) });
  };

  const toggleEquipped = (item) => {
    updateItem(item.id, {
      equipped: !item.equipped,
      // Give a sensible default slot when equipping something that lacks one.
      slot: !item.equipped ? (item.slot && item.slot !== 'other' ? item.slot : 'armor') : item.slot,
    });
  };

  // --- Drag and Drop for reordering (within the same equipped group) ---
  const handleDrop = (targetId) => {
    if (dragFromId == null || dragFromId === targetId) return;
    const fromIdx = items.findIndex(i => i.id === dragFromId);
    const toItem = items.find(i => i.id === targetId);
    const fromItem = items.find(i => i.id === dragFromId);
    if (fromIdx < 0 || !toItem || !fromItem) return;
    if (fromItem.equipped !== toItem.equipped) return; // only reorder within a group
    const list = [...items];
    list.splice(fromIdx, 1);
    const newToIdx = list.findIndex(i => i.id === targetId);
    list.splice(newToIdx, 0, fromItem);
    onUpdate({ items: list });
    setDragFromId(null);
  };

  const renderItem = (item) => {
    const isExpanded = expandedId === item.id;
    return (
      <div
        key={item.id}
        className={`dnd-equipment__item ${item.equipped ? '' : 'dnd-equipment__item--carried'}`}
        draggable={editMode}
        onDragStart={() => setDragFromId(item.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDrop(item.id)}
      >
        <div
          className="dnd-equipment__item-row"
          onClick={() => setExpandedId(isExpanded ? null : item.id)}
        >
          {editMode && <GripVertical size={12} className="dnd-equipment__grip" />}
          <span className={`dnd-equipment__expand-icon ${isExpanded ? 'open' : ''}`}>
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>

          {editMode ? (
            <input
              className="dnd-field dnd-equipment__name-input"
              value={item.name}
              onChange={(e) => updateItem(item.id, { name: e.target.value })}
              placeholder="Item name"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="dnd-equipment__item-name">{item.name || 'Unnamed'}</span>
          )}

          {/* Slot selector / badge (equipped only) */}
          {item.equipped && (editMode ? (
            <select
              className="dnd-field dnd-equipment__slot-select"
              value={item.slot || 'other'}
              onChange={(e) => updateItem(item.id, { slot: e.target.value })}
              onClick={(e) => e.stopPropagation()}
            >
              {SLOT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <span className="dnd-equipment__item-slot">{item.slot}</span>
          ))}

          {/* Inline quantity stepper — available in view mode too */}
          <div className="dnd-equipment__qty" onClick={(e) => e.stopPropagation()}>
            <button
              className="dnd-equipment__qty-btn"
              onClick={() => setQuantity(item.id, (item.quantity || 1) - 1)}
              aria-label="Decrease quantity"
            >
              <Minus size={11} />
            </button>
            <input
              type="number"
              className="dnd-equipment__qty-num"
              value={item.quantity || 1}
              min={1}
              onChange={(e) => setQuantity(item.id, parseInt(e.target.value) || 1)}
            />
            <button
              className="dnd-equipment__qty-btn"
              onClick={() => setQuantity(item.id, (item.quantity || 1) + 1)}
              aria-label="Increase quantity"
            >
              <Plus size={11} />
            </button>
          </div>

          {/* Inline equip toggle — available in view mode too */}
          <button
            className={`dnd-equipment__equip-toggle ${item.equipped ? 'dnd-equipment__equip-toggle--on' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleEquipped(item); }}
            title={item.equipped ? 'Unequip' : 'Equip'}
          >
            {item.equipped ? 'Equipped' : 'Equip'}
          </button>

          {editMode && (
            <button
              className="dnd-equipment__remove"
              onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="dnd-equipment__item-notes">
            {editMode ? (
              <textarea
                className="dnd-field dnd-equipment__notes-input"
                value={item.notes || ''}
                onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                placeholder="Properties, magical effects, attunement, AC contribution..."
                rows={3}
              />
            ) : (
              <p className="dnd-equipment__notes-text">{item.notes || 'No notes'}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dnd-equipment">
      {/* Equipped Section */}
      <div className="dnd-equipment__section">
        <div className="dnd-equipment__section-header">
          <h3 className="dnd-equipment__section-title">Equipped</h3>
          <button className="dnd-equipment__add" onClick={() => addItem(true)}>
            <Plus size={14} /> Add
          </button>
        </div>
        {equipped.length === 0 && <p className="dnd-equipment__empty">No equipped items</p>}
        {equipped.map(renderItem)}
      </div>

      {/* Carried Section */}
      <div className="dnd-equipment__section">
        <div className="dnd-equipment__section-header">
          <h3 className="dnd-equipment__section-title">Carried</h3>
          <button className="dnd-equipment__add" onClick={() => addItem(false)}>
            <Plus size={14} /> Add
          </button>
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
            const setCoins = (val) => onUpdate({
              coins: { ...(character.coins || {}), [type]: Math.max(0, val) },
            });
            return (
              <div key={type} className="dnd-coins__cell">
                <span className="dnd-coins__label">{type}</span>
                <div className="dnd-coins__value">
                  <button onClick={() => setCoins(current - 1)} aria-label={`Decrease ${type}`}>-</button>
                  <input
                    type="number"
                    className="dnd-coins__input"
                    value={current}
                    min={0}
                    onChange={(e) => setCoins(parseInt(e.target.value) || 0)}
                  />
                  <button onClick={() => setCoins(current + 1)} aria-label={`Increase ${type}`}>+</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
