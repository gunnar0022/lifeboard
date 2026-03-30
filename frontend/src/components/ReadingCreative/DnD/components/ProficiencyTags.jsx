export default function ProficiencyTags({ proficiencies, meta, editMode, onUpdate }) {
  const handleChange = (category, value) => {
    const items = value.split(',').map(s => s.trim()).filter(Boolean);
    onUpdate({ proficiencies: { ...proficiencies, [category]: items } });
  };

  const handleLangChange = (value) => {
    const items = value.split(',').map(s => s.trim()).filter(Boolean);
    onUpdate({ meta: { ...meta, languages: items } });
  };

  const renderRow = (label, items, onChange) => (
    <div className="dnd-prof-tags__row">
      <span className="dnd-prof-tags__label">{label}</span>
      {editMode ? (
        <input className="dnd-field" value={(items || []).join(', ')} onChange={e => onChange(e.target.value)} />
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
        {renderRow('Armor', proficiencies.armor, v => handleChange('armor', v))}
        {renderRow('Weapons', proficiencies.weapons, v => handleChange('weapons', v))}
        {renderRow('Tools', proficiencies.tools, v => handleChange('tools', v))}
        {renderRow('Languages', meta.languages, handleLangChange)}
      </div>
    </div>
  );
}
