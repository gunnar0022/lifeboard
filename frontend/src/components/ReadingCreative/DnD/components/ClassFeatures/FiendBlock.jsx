import { Flame, Dices, ShieldHalf, FlameKindling } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import { OnceToggle } from './trackers';

/**
 * The Fiend — Combat tab. Dark One's Blessing pays out temp HP each time you drop
 * a foe (one tap grants it), Dark One's Own Luck is a once-per-rest d10, Fiendish
 * Resilience is a rest-chosen resistance picker, and Hurl Through Hell is the
 * once-per-long-rest banishment. State lives in classFeature.
 */
const ACCENT = 'var(--dnd-class-warlock)';
const DAMAGE_TYPES = ['acid', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'poison', 'psychic', 'radiant', 'thunder'];

export default function FiendBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const chaMod = abilityMod(character.abilities?.CHA || 10);
  const blessing = Math.max(1, chaMod + level);
  const resistance = cf.fiendishResistance || null;

  const patch = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      {/* Dark One's Blessing — temp HP on a kill */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Flame size={13} /> Dark One's Blessing</h4>
          <span className="dnd-warmagic__chip">+{blessing} temp HP</span>
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">When you drop a hostile creature to 0 HP, gain <strong>{blessing}</strong> temp HP (CHA + level).</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => patch({ _grantTempHp: blessing })}>Gain</button>
          </div>
        </div>
      </div>

      {/* Dark One's Own Luck — d10 to a check or save */}
      {level >= 6 && (
        <OnceToggle
          icon={<Dices size={13} />} title="Dark One's Own Luck" rest="short or long rest"
          used={!!cf.darkLuckUsed}
          note="After seeing the roll on an ability check or saving throw, add a d10 to it."
          onToggle={() => patch({ darkLuckUsed: !cf.darkLuckUsed })}
        />
      )}

      {/* Fiendish Resilience — chosen resistance */}
      {level >= 10 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><ShieldHalf size={13} /> Fiendish Resilience</h4>
            {resistance && <span className="dnd-warmagic__chip">{resistance} resist</span>}
          </div>
          <div className="dnd-warmagic__pick">
            {DAMAGE_TYPES.map(t => (
              <button key={t}
                className={`dnd-warmagic__pick-btn ${resistance === t ? 'dnd-warmagic__pick-btn--active' : ''}`}
                onClick={() => patch({ fiendishResistance: resistance === t ? null : t })}>{t}</button>
            ))}
          </div>
          <p className="dnd-warmagic__note">Resistance to the chosen type (set on a rest). Magical or silvered weapons ignore it.</p>
        </div>
      )}

      {/* Hurl Through Hell — banish a struck foe */}
      {level >= 14 && (
        <OnceToggle
          icon={<FlameKindling size={13} />} title="Hurl Through Hell" rest="long rest"
          used={!!cf.hurlUsed}
          note={<>On a hit, banish the target through the Lower Planes; it returns at the end of your next turn. If not a fiend, it takes <strong>10d10</strong> psychic damage.</>}
          onToggle={() => patch({ hurlUsed: !cf.hurlUsed })}
        />
      )}
    </div>
  );
}
