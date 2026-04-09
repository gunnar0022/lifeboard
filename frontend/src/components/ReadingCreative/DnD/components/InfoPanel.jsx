import { Plus, Trash2, X } from 'lucide-react';

/**
 * InfoPanel — character details and custom boxes.
 * Equipment and coins have moved to the Equipment tab.
 */
export default function InfoPanel({ customBoxes, editMode, onUpdate }) {
  const boxes = customBoxes || [];

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

  return (
    <div className="dnd-info-v2">
      <div className="dnd-info-v2__boxes">
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
  );
}
