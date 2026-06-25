import { Hammer, Swords, Shield, Flame, Anvil } from 'lucide-react';
import ChannelDivinityPanel from './ChannelDivinityPanel';

/**
 * Forge Domain — Combat tab. Two hooks: the once-per-rest Blessing of the Forge
 * (imbue a weapon or armor with a +1, tracked here) and Channel Divinity:
 * Artisan's Blessing (drawing from the cleric's shared charges). Soul of the
 * Forge, Divine Strike (fire), and Saint of Forge and Fire ride as reminders.
 */
const ACCENT = 'var(--dnd-class-cleric)';

export default function ForgeDomainBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const strikeDice = level >= 14 ? '2d8' : '1d8';

  const blessing = cf.blessingOfForge || { target: 'weapon', used: false };
  const setBlessing = (fields) => onUpdate({ classFeature: { ...cf, blessingOfForge: { ...blessing, ...fields } } });

  const options = [{
    name: "Artisan's Blessing",
    icon: <Anvil size={13} />,
    desc: "1-hour ritual: craft a nonmagical metal item worth ≤ 100 gp (weapon, armor, 10 ammo, tools, or another metal object), laying out metal of equal value.",
  }];

  return (
    <div className="dnd-warmagic dnd-cleric" style={{ '--block-accent': ACCENT }}>
      {/* Blessing of the Forge — once per long rest */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Hammer size={13} /> Blessing of the Forge</h4>
          <span className={`dnd-warmagic__uses ${blessing.used ? 'dnd-cleric__used' : ''}`}>{blessing.used ? 'spent' : 'ready'}</span>
        </div>
        <div className="dnd-cleric__forge-pick">
          <button className={`dnd-warmagic__pick-btn ${blessing.target === 'weapon' ? 'dnd-warmagic__pick-btn--active' : ''}`}
            onClick={() => setBlessing({ target: 'weapon' })}><Swords size={11} /> Weapon (+1 atk/dmg)</button>
          <button className={`dnd-warmagic__pick-btn ${blessing.target === 'armor' ? 'dnd-warmagic__pick-btn--active' : ''}`}
            onClick={() => setBlessing({ target: 'armor' })}><Shield size={11} /> Armor (+1 AC)</button>
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Imbue one nonmagical {blessing.target} at the end of a long rest until your next one. Once per long rest.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => setBlessing({ used: !blessing.used })}>
              {blessing.used ? 'Reset' : 'Imbue'}
            </button>
          </div>
        </div>
      </div>

      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} source="cleric" />

      <div className="dnd-warmagic__reminders">
        {level >= 6 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Flame size={12} />
            <span><strong>Soul of the Forge</strong> — resistance to fire damage; +1 AC while wearing heavy armor.</span>
          </div>
        )}
        {level >= 8 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Swords size={12} />
            <span><strong>Divine Strike</strong> — once per turn, a weapon hit deals an extra <strong>{strikeDice}</strong> fire damage.</span>
          </div>
        )}
        {level >= 17 && (
          <div className="dnd-warmagic__reminder">
            <Flame size={12} />
            <span><strong>Saint of Forge and Fire</strong> — immunity to fire; in heavy armor, resistance to nonmagical bludgeoning, piercing &amp; slashing.</span>
          </div>
        )}
      </div>
    </div>
  );
}
