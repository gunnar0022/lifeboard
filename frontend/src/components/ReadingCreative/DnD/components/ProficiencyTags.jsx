import { useState, useRef } from 'react';

export default function ProficiencyTags({ proficiencies, meta, editMode, onUpdate }) {
  // Store raw text while editing to allow commas and special chars
  const [editValues, setEditValues] = useState({});

  const getEditValue = (key, items) => {
    if (key in editValues) return editValues[key];
    return (items || []).join(', ');
  };

  const handleTextChange = (key, value) => {
    setEditValues(prev => ({ ...prev, [key]: value }));
  };

  const commitChange = (key, category) => {
    const raw = editValues[key];
    if (raw === undefined) return;
    const items = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (category === 'languages') {
      onUpdate({ meta: { ...meta, languages: items } });
    } else {
      onUpdate({ proficiencies: { ...proficiencies, [category]: items } });
    }
    setEditValues(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const renderRow = (label, items, key, category) => (
    <div className="dnd-prof-tags__row">
      <span className="dnd-prof-tags__label">{label}</span>
      {editMode ? (
        <input
          className="dnd-field"
          value={getEditValue(key, items)}
          onChange={e => handleTextChange(key, e.target.value)}
          onBlur={() => commitChange(key, category)}
        />
      ) : (
        <div className="dnd-prof-tags__tags">
          {(items || []).map((item, i) => (
            <span key={i} className="dnd-prof-tags__tag">{item}</span>
          ))}
          {(!items || items.length === 0) && <span className="dnd-prof-tags__empty">None</span>}
        </div>
      )}
    </div>
  );

  return (
    <div className="dnd-prof-tags">
      <h3 className="dnd-section-title">Proficiencies</h3>
      <div className="dnd-prof-tags__grid">
        {renderRow('Armor', proficiencies.armor, 'armor', 'armor')}
        {renderRow('Weapons', proficiencies.weapons, 'weapons', 'weapons')}
        {renderRow('Tools', proficiencies.tools, 'tools', 'tools')}
        {renderRow('Languages', meta.languages, 'languages', 'languages')}
      </div>
    </div>
  );
}
