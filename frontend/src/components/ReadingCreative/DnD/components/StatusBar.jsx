import { useState } from 'react';
import { Sparkles, Plus, X, ChevronUp, ChevronDown } from 'lucide-react';

const CONDITIONS_5E = [
  { name: 'Blinded', desc: 'Auto-fail sight checks. Attack rolls have disadvantage, attacks against have advantage.' },
  { name: 'Charmed', desc: 'Cannot attack charmer. Charmer has advantage on social checks.' },
  { name: 'Deafened', desc: 'Auto-fail hearing checks.' },
  { name: 'Frightened', desc: 'Disadvantage on ability checks and attacks while source is in sight. Cannot willingly move closer.' },
  { name: 'Grappled', desc: 'Speed becomes 0. Ends if grappler incapacitated or forced apart.' },
  { name: 'Incapacitated', desc: 'Cannot take actions or reactions.' },
  { name: 'Invisible', desc: 'Attacks against have disadvantage, your attacks have advantage.' },
  { name: 'Paralyzed', desc: 'Incapacitated, auto-fail STR/DEX saves, attacks have advantage, melee hits are crits.' },
  { name: 'Petrified', desc: 'Weight x10, incapacitated, unaware. Resistance to all damage. Immune to poison/disease.' },
  { name: 'Poisoned', desc: 'Disadvantage on attack rolls and ability checks.' },
  { name: 'Prone', desc: 'Disadvantage on attacks. Melee attacks against have advantage, ranged have disadvantage.' },
  { name: 'Restrained', desc: 'Speed 0. Attacks have disadvantage, attacks against have advantage. Disadvantage on DEX saves.' },
  { name: 'Stunned', desc: 'Incapacitated, auto-fail STR/DEX saves, attacks against have advantage.' },
  { name: 'Unconscious', desc: 'Incapacitated, prone, auto-fail STR/DEX saves. Attacks have advantage, melee crits.' },
];

const EXHAUSTION_EFFECTS = [
  '',
  'Disadvantage on ability checks',
  'Speed halved',
  'Disadvantage on attacks and saves',
  'HP maximum halved',
  'Speed reduced to 0',
  'Death',
];

export default function StatusBar({ character, onUpdate }) {
  const [showConditionPicker, setShowConditionPicker] = useState(false);
  const [hoveredCondition, setHoveredCondition] = useState(null);

  const inspiration = character.inspiration || false;
  const activeConditions = character.activeConditions || [];
  const exhaustionLevel = character.exhaustionLevel || 0;

  const toggleInspiration = () => {
    onUpdate({ inspiration: !inspiration });
  };

  const addCondition = (name) => {
    if (!activeConditions.includes(name)) {
      onUpdate({ activeConditions: [...activeConditions, name] });
    }
    setShowConditionPicker(false);
  };

  const removeCondition = (name) => {
    onUpdate({ activeConditions: activeConditions.filter(c => c !== name) });
  };

  const setExhaustion = (level) => {
    onUpdate({ exhaustionLevel: Math.max(0, Math.min(6, level)) });
  };

  const hasAnyStatus = inspiration || activeConditions.length > 0 || exhaustionLevel > 0;

  return (
    <div className="dnd-statusbar">
      {/* Inspiration */}
      <button
        className={`dnd-statusbar__inspiration ${inspiration ? 'dnd-statusbar__inspiration--active' : ''}`}
        onClick={toggleInspiration}
        title={inspiration ? 'Has Inspiration (click to remove)' : 'No Inspiration (click to grant)'}
      >
        <Sparkles size={14} />
        <span>Inspiration</span>
      </button>

      {/* Active Conditions */}
      {activeConditions.map(name => {
        const cond = CONDITIONS_5E.find(c => c.name === name);
        return (
          <span
            key={name}
            className="dnd-statusbar__condition"
            onClick={() => removeCondition(name)}
            onMouseEnter={() => setHoveredCondition(name)}
            onMouseLeave={() => setHoveredCondition(null)}
            title={cond?.desc || ''}
          >
            {name}
            <X size={10} />
          </span>
        );
      })}

      {/* Add Condition Button */}
      <div className="dnd-statusbar__add-wrap">
        <button
          className="dnd-statusbar__add-condition"
          onClick={() => setShowConditionPicker(!showConditionPicker)}
          title="Add condition"
        >
          <Plus size={12} /> Condition
        </button>
        {showConditionPicker && (
          <div className="dnd-statusbar__condition-picker">
            {CONDITIONS_5E.filter(c => !activeConditions.includes(c.name)).map(c => (
              <button
                key={c.name}
                className="dnd-statusbar__condition-option"
                onClick={() => addCondition(c.name)}
                title={c.desc}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Exhaustion */}
      {exhaustionLevel > 0 && (
        <div
          className={`dnd-statusbar__exhaustion dnd-statusbar__exhaustion--${Math.min(exhaustionLevel, 3) > 2 ? 'severe' : 'mild'}`}
          title={EXHAUSTION_EFFECTS[exhaustionLevel] || ''}
        >
          <span>Exhaustion {exhaustionLevel}</span>
          <button onClick={() => setExhaustion(exhaustionLevel - 1)}><ChevronDown size={10} /></button>
          <button onClick={() => setExhaustion(exhaustionLevel + 1)}><ChevronUp size={10} /></button>
        </div>
      )}
      {exhaustionLevel === 0 && (
        <button
          className="dnd-statusbar__exhaustion-add"
          onClick={() => setExhaustion(1)}
          title="Add exhaustion level"
        >
          Exhaustion
        </button>
      )}
    </div>
  );
}
