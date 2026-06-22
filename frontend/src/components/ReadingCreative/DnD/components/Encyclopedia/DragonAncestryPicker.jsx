import { useState } from 'react';
import { DRAGON_ANCESTRY, DRAGON_COLORS } from '../../rules/shared/dragonAncestry';
import Mech from './Mech';

// Rough chromatic/metallic swatch per dragon color so the dropdown reads at a
// glance. Decorative only.
const SWATCH = {
  Black: '#2a2a2e', Blue: '#2a5aaa', Brass: '#b08d57', Bronze: '#a97142',
  Copper: '#b87333', Gold: '#caa52a', Green: '#3a7a3a', Red: '#a82020',
  Silver: '#a8b0b8', White: '#cdd6dd',
};

// Static breath-weapon dice progression (level-independent table for the wiki).
const BREATH_TABLE = [
  { lvl: '1st', dice: '2d6' }, { lvl: '6th', dice: '3d6' },
  { lvl: '11th', dice: '4d6' }, { lvl: '16th', dice: '5d6' },
];

/**
 * Dragonborn draconic ancestry browser. A dropdown of dragon types; picking one
 * reveals exactly what that bloodline grants — breath damage type, area, save,
 * and the resistance that comes with it — so a player can see what they're
 * getting into before committing.
 */
export default function DragonAncestryPicker() {
  const [color, setColor] = useState(DRAGON_COLORS[0]);
  const a = DRAGON_ANCESTRY[color];

  return (
    <div className="wiki-dragon">
      <label className="wiki-dragon__pick">
        <span className="wiki-dragon__pick-label">Draconic ancestry</span>
        <span className="wiki-dragon__select-wrap">
          <span className="wiki-dragon__swatch" style={{ background: SWATCH[color] }} />
          <select className="wiki-dragon__select" value={color} onChange={e => setColor(e.target.value)}>
            {DRAGON_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </span>
      </label>

      <div className="wiki-dragon__stats">
        <div className="wiki-dragon__stat">
          <span className="wiki-dragon__stat-k">Damage</span>
          <span className="wiki-dragon__stat-v">{a.damage}</span>
        </div>
        <div className="wiki-dragon__stat">
          <span className="wiki-dragon__stat-k">Breath area</span>
          <span className="wiki-dragon__stat-v"><Mech text={a.area} /></span>
        </div>
        <div className="wiki-dragon__stat">
          <span className="wiki-dragon__stat-k">Save</span>
          <span className="wiki-dragon__stat-v">{a.save}</span>
        </div>
        <div className="wiki-dragon__stat">
          <span className="wiki-dragon__stat-k">Resistance</span>
          <span className="wiki-dragon__stat-v">{a.damage}</span>
        </div>
      </div>

      <div className="wiki-dragon__breath">
        <span className="wiki-dragon__stat-k">Breath weapon damage by level</span>
        <div className="wiki-dragon__breath-row">
          {BREATH_TABLE.map(b => (
            <span key={b.lvl} className="wiki-dragon__breath-step">
              <span className="mech mech--num">{b.lvl}</span>
              <span className="mech mech--dice">{b.dice}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
