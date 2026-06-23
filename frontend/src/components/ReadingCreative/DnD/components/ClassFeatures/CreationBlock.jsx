import { Hammer, Music, Wand2, Shield, Heart } from 'lucide-react';
import { proficiencyBonus, abilityMod } from '../../dndUtils';

/**
 * College of Creation — Combat tab. Two action features, each once per long rest
 * (or a spell slot): Performance of Creation (size + duration scale with level/PB)
 * and Animating Performance, which spins up a Dancing Item — rendered as a live
 * stat block whose HP and to-hit track your level and Charisma. Mote of Potential
 * rides on every Bardic Inspiration die. Accent: creator's amber.
 */
function maxItemSize(level) {
  if (level >= 14) return 'Huge';
  if (level >= 6) return 'Large';
  return 'Medium';
}

export default function CreationBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const pb = proficiencyBonus(level);
  const chaMod = abilityMod(character.abilities?.CHA || 10);
  const saveDC = 8 + pb + chaMod;
  const spellAtk = pb + chaMod;
  const danceHP = 10 + 5 * level;
  const atkStr = spellAtk >= 0 ? `+${spellAtk}` : `${spellAtk}`;

  const performanceUsed = cf.performanceCreationUsed || false;
  const animatingUsed = cf.animatingUsed || false;
  const hasAnimating = level >= 6;

  const set = (key, val) => onUpdate({ classFeature: { ...cf, [key]: val } });

  return (
    <div className="dnd-bardsub" style={{ '--accent': '#d9a441' }}>
      {/* Mote of Potential — rides on Bardic Inspiration */}
      <div className="dnd-bardsub__card dnd-bardsub__card--hero">
        <div className="dnd-bardsub__head">
          <span className="dnd-bardsub__title"><Music size={13} /> Mote of Potential</span>
        </div>
        <p className="dnd-bardsub__note">Each Bardic Inspiration die you give spawns an orbiting mote. When the die is used:</p>
        <ul className="dnd-bardsub__mote-list">
          <li><strong>Check</strong> — reroll the die, keep either result.</li>
          <li><strong>Attack</strong> — mote shatters: target &amp; creatures within 5 ft, <strong>CON save DC {saveDC}</strong> or take thunder = the die roll.</li>
          <li><strong>Save</strong> — gain temp HP = die roll <strong>+ {chaMod} (CHA)</strong>.</li>
        </ul>
      </div>

      {/* Performance of Creation */}
      <div className={`dnd-bardsub__card ${performanceUsed ? 'dnd-bardsub__card--spent' : ''}`}>
        <div className="dnd-bardsub__head">
          <span className="dnd-bardsub__title"><Hammer size={13} /> Performance of Creation</span>
          <span className="dnd-bardsub__badge">1 / long rest</span>
        </div>
        <div className="dnd-bardsub__chips">
          <span className="dnd-bardsub__chip dnd-bardsub__chip--big">{maxItemSize(level)} max</span>
          <span className="dnd-bardsub__chip">{pb} hr{pb === 1 ? '' : 's'}</span>
          {level >= 14 && <span className="dnd-bardsub__chip">×{Math.max(2, chaMod)} items</span>}
        </div>
        <div className="dnd-bardsub__row">
          <span className="dnd-bardsub__note">Action: conjure a nonmagical item{level >= 14 ? '.' : <> (≤ {20 * level} gp).</>} Or spend a 2nd+ slot to reuse.</span>
          <div className="dnd-bardsub__btns">
            {performanceUsed && <button className="dnd-bardsub__btn" onClick={() => set('performanceCreationUsed', false)}>Reset</button>}
            <button className="dnd-bardsub__btn dnd-bardsub__btn--spend" onClick={() => set('performanceCreationUsed', true)} disabled={performanceUsed}>{performanceUsed ? 'Spent' : 'Create'}</button>
          </div>
        </div>
      </div>

      {/* Animating Performance + Dancing Item stat block */}
      {hasAnimating && (
        <div className={`dnd-bardsub__card ${animatingUsed ? 'dnd-bardsub__card--spent' : ''}`}>
          <div className="dnd-bardsub__head">
            <span className="dnd-bardsub__title"><Wand2 size={13} /> Animating Performance</span>
            <span className="dnd-bardsub__badge">1 / long rest</span>
          </div>

          <div className="dnd-dancing">
            <div className="dnd-dancing__name">Dancing Item <span className="dnd-dancing__type">construct · obeys you 1 hr</span></div>
            <div className="dnd-dancing__stats">
              <span className="dnd-dancing__stat"><Shield size={11} /> AC <strong>16</strong></span>
              <span className="dnd-dancing__stat"><Heart size={11} /> HP <strong>{danceHP}</strong></span>
              <span className="dnd-dancing__stat">Speed <strong>30/fly 30</strong></span>
            </div>
            <div className="dnd-dancing__attack">
              <span className="dnd-dancing__atk-name">Force-Empowered Slam</span>
              <span className="dnd-dancing__atk-line"><strong>{atkStr}</strong> to hit · <strong>1d10+{pb}</strong> force</span>
            </div>
            <p className="dnd-dancing__note">Takes Dodge each turn; spend a bonus action (alongside Bardic Inspiration) to command another action.</p>
          </div>

          <div className="dnd-bardsub__row">
            <span className="dnd-bardsub__note">Animate a Large or smaller item within 30 ft. Or spend a 3rd+ slot to reuse.</span>
            <div className="dnd-bardsub__btns">
              {animatingUsed && <button className="dnd-bardsub__btn" onClick={() => set('animatingUsed', false)}>Reset</button>}
              <button className="dnd-bardsub__btn dnd-bardsub__btn--spend" onClick={() => set('animatingUsed', true)} disabled={animatingUsed}>{animatingUsed ? 'Spent' : 'Animate'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
