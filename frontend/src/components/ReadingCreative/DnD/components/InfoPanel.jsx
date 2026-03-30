import { Plus, Trash2, X } from 'lucide-react';

/**
 * InfoPanel — custom boxes system.
 * Data shape: character.customBoxes = [
 *   { title: "Personality", fields: [{ label: "Trait", value: "..." }, ...] },
 *   { title: "Backstory", fields: [{ label: "Summary", value: "..." }] },
 * ]
 *
 * Also shows Equipment on the left and custom boxes on the right,
 * with coins always at the bottom.
 */
export default function InfoPanel({ customBoxes, equipment, coins, editMode, onUpdate }) {
  const boxes = customBoxes || [];

  // --- Box operations ---
  const addBox = () => {
    onUpdate({
      customBoxes: [...boxes, { title: 'New Section', fields: [{ label: 'Field', value: '' }] }],
    });
  };

  const removeBox = (boxIdx) => {
    onUpdate({ customBoxes: boxes.filter((_, i) => i !== boxIdx) });
  };

  const updateBoxTitle = (boxIdx, title) => {
    const updated = boxes.map((b, i) => i === boxIdx ? { ...b, title } : b);
    onUpdate({ customBoxes: updated });
  };

  // --- Field operations ---
  const addField = (boxIdx) => {
    const updated = boxes.map((b, i) =>
      i === boxIdx ? { ...b, fields: [...b.fields, { label: 'New Field', value: '' }] } : b
    );
    onUpdate({ customBoxes: updated });
  };

  const removeField = (boxIdx, fieldIdx) => {
    const updated = boxes.map((b, i) =>
      i === boxIdx ? { ...b, fields: b.fields.filter((_, fi) => fi !== fieldIdx) } : b
    );
    onUpdate({ customBoxes: updated });
  };

  const updateField = (boxIdx, fieldIdx, key, value) => {
    const updated = boxes.map((b, i) =>
      i === boxIdx
        ? { ...b, fields: b.fields.map((f, fi) => fi === fieldIdx ? { ...f, [key]: value } : f) }
        : b
    );
    onUpdate({ customBoxes: updated });
  };

  // --- Equipment operations ---
  const handleItemChange = (index, value) => {
    const updated = equipment.map((item, i) => i === index ? value : item);
    onUpdate({ equipment: updated });
  };
  const addItem = () => onUpdate({ equipment: [...(equipment || []), ''] });
  const removeItem = (index) => onUpdate({ equipment: (equipment || []).filter((_, i) => i !== index) });

  // --- Coin operations ---
  const coinTypes = ['CP', 'SP', 'EP', 'GP', 'PP'];
  const adjustCoin = (type, delta) => {
    const current = (coins || {})[type] || 0;
    onUpdate({ coins: { ...(coins || {}), [type]: Math.max(0, current + delta) } });
  };

  return (
    <div className="dnd-info-v2">
      <div className="dnd-info-v2__columns">
        {/* Left: Equipment */}
        <div className="dnd-info-v2__col">
          <h3 className="dnd-section-title">Equipment</h3>
          <div className="dnd-info-v2__box">
            <div className="dnd-equipment__list">
              {(equipment || []).map((item, i) => (
                <div key={i} className="dnd-equipment__item">
                  {editMode ? (
                    <>
                      <input className="dnd-field" value={item}
                        onChange={e => handleItemChange(i, e.target.value)} placeholder="Item name" />
                      <button className="dnd-equipment__remove" onClick={() => removeItem(i)}>
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <span>{item}</span>
                  )}
                </div>
              ))}
            </div>
            {editMode && (
              <button className="dnd-add-btn" onClick={addItem}>+ Add Item</button>
            )}
          </div>
        </div>

        {/* Right: Custom Boxes */}
        <div className="dnd-info-v2__col">
          {boxes.map((box, bi) => (
            <div key={bi} className="dnd-info-v2__custom-box">
              <div className="dnd-info-v2__box-header">
                {editMode ? (
                  <input
                    className="dnd-info-v2__box-title-input"
                    value={box.title}
                    onChange={e => updateBoxTitle(bi, e.target.value)}
                    placeholder="Section title"
                  />
                ) : (
                  <h3 className="dnd-section-title" style={{ margin: 0 }}>{box.title}</h3>
                )}
                {editMode && (
                  <button className="dnd-info-v2__box-delete" onClick={() => removeBox(bi)}
                    title="Delete this section">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="dnd-info-v2__fields">
                {box.fields.map((field, fi) => (
                  <div key={fi} className="dnd-info-v2__field">
                    {editMode ? (
                      <>
                        <div className="dnd-info-v2__field-header">
                          <input
                            className="dnd-info-v2__field-label-input"
                            value={field.label}
                            onChange={e => updateField(bi, fi, 'label', e.target.value)}
                            placeholder="Field name"
                          />
                          <button className="dnd-info-v2__field-delete" onClick={() => removeField(bi, fi)}>
                            <X size={12} />
                          </button>
                        </div>
                        <textarea
                          className="dnd-field dnd-field--textarea"
                          value={field.value}
                          onChange={e => updateField(bi, fi, 'value', e.target.value)}
                          placeholder="Enter text..."
                          rows={2}
                        />
                      </>
                    ) : (
                      <>
                        <span className="dnd-info-v2__field-label">{field.label}</span>
                        <p className="dnd-info-v2__field-value">{field.value || '---'}</p>
                      </>
                    )}
                  </div>
                ))}
                {editMode && (
                  <button className="dnd-add-btn" onClick={() => addField(bi)}>+ Add Field</button>
                )}
              </div>
            </div>
          ))}

          {editMode && (
            <button className="dnd-info-v2__add-box" onClick={addBox}>
              <Plus size={16} /> Add Section
            </button>
          )}
        </div>
      </div>

      {/* Coins — always at bottom, always interactive */}
      <div className="dnd-info-v2__coins-section">
        <h3 className="dnd-section-title">Coins</h3>
        <div className="dnd-coins">
          {coinTypes.map(type => (
            <div key={type} className="dnd-coins__cell">
              <span className="dnd-coins__label">{type}</span>
              <div className="dnd-coins__value">
                <button onClick={() => adjustCoin(type, -1)}>-</button>
                <span>{(coins || {})[type] || 0}</span>
                <button onClick={() => adjustCoin(type, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
