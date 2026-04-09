import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';

const SLOT_OPTIONS = [
  'armor', 'shield', 'main hand', 'off hand', 'cloak', 'amulet',
  'ring', 'boots', 'gloves', 'focus', 'other',
];

export default function EquipmentTab({ character, editMode, onUpdate }) {
  const equipped = character.equippedItems || [];
  const carried = character.carriedItems || [];
  const [expandedId, setExpandedId] = useState(null);
  const [dragFrom, setDragFrom] = useState(null);

  // --- Equipped CRUD ---
  const addEquipped = () => {
    onUpdate({
      equippedItems: [...equipped, { id: Date.now(), name: '', slot: 'other', notes: '' }],
    });
  };

  const updateEquipped = (idx, fields) => {
    const updated = equipped.map((item, i) => i === idx ? { ...item, ...fields } : item);
    onUpdate({ equippedItems: updated });
  };

  const removeEquipped = (idx) => {
    onUpdate({ equippedItems: equipped.filter((_, i) => i !== idx) });
  };

  // --- Carried CRUD ---
  const addCarried = () => {
    onUpdate({
      carriedItems: [...carried, { id: Date.now(), name: '', quantity: 1, notes: '' }],
    });
  };

  const updateCarried = (idx, fields) => {
    const updated = carried.map((item, i) => i === idx ? { ...item, ...fields } : item);
    onUpdate({ carriedItems: updated });
  };

  const removeCarried = (idx) => {
    onUpdate({ carriedItems: carried.filter((_, i) => i !== idx) });
  };

  // --- Drag and Drop for reordering ---
  const handleDragStart = (section, idx) => {
    setDragFrom({ section, idx });
  };

  const handleDrop = (section, targetIdx) => {
    if (!dragFrom || dragFrom.section !== section) return;
    const list = section === 'equipped' ? [...equipped] : [...carried];
    const [moved] = list.splice(dragFrom.idx, 1);
    list.splice(targetIdx, 0, moved);
    onUpdate({ [section === 'equipped' ? 'equippedItems' : 'carriedItems']: list });
    setDragFrom(null);
  };

  return (
    <div className="dnd-equipment">
      {/* Equipped Section */}
      <div className="dnd-equipment__section">
        <div className="dnd-equipment__section-header">
          <h3 className="dnd-equipment__section-title">Equipped</h3>
          <button className="dnd-equipment__add" onClick={addEquipped}>
            <Plus size={14} /> Add
          </button>
        </div>

        {equipped.length === 0 && (
          <p className="dnd-equipment__empty">No equipped items</p>
        )}

        {equipped.map((item, i) => {
          const isExpanded = expandedId === `eq-${i}`;
          return (
            <div
              key={item.id || i}
              className="dnd-equipment__item"
              draggable={editMode}
              onDragStart={() => handleDragStart('equipped', i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop('equipped', i)}
            >
              <div
                className="dnd-equipment__item-row"
                onClick={() => setExpandedId(isExpanded ? null : `eq-${i}`)}
              >
                {editMode && <GripVertical size={12} className="dnd-equipment__grip" />}
                <span className={`dnd-equipment__expand-icon ${isExpanded ? 'open' : ''}`}>
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </span>
                {editMode ? (
                  <>
                    <input
                      className="dnd-field dnd-equipment__name-input"
                      value={item.name}
                      onChange={(e) => updateEquipped(i, { name: e.target.value })}
                      placeholder="Item name"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <select
                      className="dnd-field dnd-equipment__slot-select"
                      value={item.slot || 'other'}
                      onChange={(e) => updateEquipped(i, { slot: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {SLOT_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      className="dnd-equipment__remove"
                      onClick={(e) => { e.stopPropagation(); removeEquipped(i); }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="dnd-equipment__item-name">{item.name || 'Unnamed'}</span>
                    <span className="dnd-equipment__item-slot">{item.slot}</span>
                  </>
                )}
              </div>

              {isExpanded && (
                <div className="dnd-equipment__item-notes">
                  {editMode ? (
                    <textarea
                      className="dnd-field dnd-equipment__notes-input"
                      value={item.notes || ''}
                      onChange={(e) => updateEquipped(i, { notes: e.target.value })}
                      placeholder="Properties, magical effects, attunement, AC contribution..."
                      rows={3}
                    />
                  ) : (
                    <p className="dnd-equipment__notes-text">
                      {item.notes || 'No notes'}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Carried Section */}
      <div className="dnd-equipment__section">
        <div className="dnd-equipment__section-header">
          <h3 className="dnd-equipment__section-title">Carried</h3>
          {editMode && (
            <button className="dnd-equipment__add" onClick={addCarried}>
              <Plus size={14} /> Add
            </button>
          )}
        </div>

        {carried.length === 0 && (
          <p className="dnd-equipment__empty">No carried items</p>
        )}

        {carried.map((item, i) => (
          <div
            key={item.id || i}
            className="dnd-equipment__item dnd-equipment__item--carried"
            draggable={editMode}
            onDragStart={() => handleDragStart('carried', i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop('carried', i)}
          >
            <div className="dnd-equipment__item-row">
              {editMode && <GripVertical size={12} className="dnd-equipment__grip" />}
              {editMode ? (
                <>
                  <input
                    className="dnd-field dnd-equipment__name-input"
                    value={item.name}
                    onChange={(e) => updateCarried(i, { name: e.target.value })}
                    placeholder="Item name"
                  />
                  <input
                    type="number"
                    className="dnd-field dnd-equipment__qty-input"
                    value={item.quantity || 1}
                    onChange={(e) => updateCarried(i, { quantity: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                  <input
                    className="dnd-field dnd-equipment__carried-notes"
                    value={item.notes || ''}
                    onChange={(e) => updateCarried(i, { notes: e.target.value })}
                    placeholder="Notes"
                  />
                  <button className="dnd-equipment__remove" onClick={() => removeCarried(i)}>
                    <Trash2 size={12} />
                  </button>
                </>
              ) : (
                <>
                  <span className="dnd-equipment__item-name">{item.name || 'Unnamed'}</span>
                  {item.quantity > 1 && (
                    <span className="dnd-equipment__item-qty">x{item.quantity}</span>
                  )}
                  {item.notes && (
                    <span className="dnd-equipment__item-note">{item.notes}</span>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Coins */}
      <div className="dnd-equipment__section">
        <h3 className="dnd-equipment__section-title">Coins</h3>
        <div className="dnd-coins">
          {['CP', 'SP', 'EP', 'GP', 'PP'].map(type => (
            <div key={type} className="dnd-coins__cell">
              <span className="dnd-coins__label">{type}</span>
              <div className="dnd-coins__value">
                <button onClick={() => {
                  const current = (character.coins || {})[type] || 0;
                  onUpdate({ coins: { ...(character.coins || {}), [type]: Math.max(0, current - 1) } });
                }}>-</button>
                <span>{(character.coins || {})[type] || 0}</span>
                <button onClick={() => {
                  const current = (character.coins || {})[type] || 0;
                  onUpdate({ coins: { ...(character.coins || {}), [type]: current + 1 } });
                }}>+</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
