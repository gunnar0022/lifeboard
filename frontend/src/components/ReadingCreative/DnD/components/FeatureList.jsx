import { useState } from 'react';

export default function FeatureList({ features, editMode, onUpdate }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  const handleChange = (index, field, value) => {
    const updated = features.map((f, i) => i === index ? { ...f, [field]: value } : f);
    onUpdate({ features: updated });
  };

  const addFeature = () => {
    onUpdate({ features: [...features, { name: '', source: '', desc: '' }] });
  };

  const removeFeature = (index) => {
    onUpdate({ features: features.filter((_, i) => i !== index) });
  };

  const sourceColors = {
    Barbarian: '#8b0000', Rogue: '#4a2066', Fighter: '#4a6580',
    Subclass: '#c9a96e', Race: '#2a5a2a', Homebrew: '#8a4a00',
    Wizard: '#1a3a6a', Warlock: '#5a2a5a', Cleric: '#c9a96e',
    Druid: '#2a5a2a', Paladin: '#8a8a3a', Ranger: '#3a6a3a',
    Bard: '#6a3a5a', Monk: '#5a7a8a', Artificer: '#6a5a3a',
    Sorcerer: '#8a4a00',
  };

  return (
    <div className="dnd-features">
      <h3 className="dnd-section-title">Features & Traits</h3>
      <div className="dnd-features__grid">
        {features.map((feat, i) => {
          if (editMode) {
            return (
              <div key={i} className="dnd-features__card dnd-features__card--edit">
                <button className="dnd-features__remove" onClick={() => removeFeature(i)}>X</button>
                <input className="dnd-field" value={feat.name} placeholder="Feature name"
                  onChange={e => handleChange(i, 'name', e.target.value)} />
                <input className="dnd-field" value={feat.source} placeholder="Source"
                  onChange={e => handleChange(i, 'source', e.target.value)} />
                <textarea className="dnd-field dnd-field--textarea" value={feat.desc} placeholder="Description"
                  onChange={e => handleChange(i, 'desc', e.target.value)} rows={3} />
              </div>
            );
          }

          const isLong = feat.desc && feat.desc.length > 100;
          const showFull = expanded[i] || !isLong;

          return (
            <div key={i} className="dnd-features__card">
              <div className="dnd-features__header">
                <span className="dnd-features__name">{feat.name}</span>
                {feat.source && (
                  <span className="dnd-features__source"
                    style={{ borderColor: sourceColors[feat.source] || '#3a3228' }}>
                    {feat.source}
                  </span>
                )}
              </div>
              <p className="dnd-features__desc">
                {showFull ? feat.desc : `${feat.desc.slice(0, 100)}...`}
              </p>
              {isLong && (
                <button className="dnd-features__toggle" onClick={() => toggle(i)}>
                  {showFull ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {editMode && (
        <button className="dnd-add-btn" onClick={addFeature}>+ Add Feature</button>
      )}
    </div>
  );
}
