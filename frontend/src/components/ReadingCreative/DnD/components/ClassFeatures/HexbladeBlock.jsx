import { Skull, Swords, Ghost, Crosshair, ShieldCheck } from 'lucide-react';
import { abilityMod, proficiencyBonus, formatMod } from '../../dndUtils';

/**
 * The Hexblade — Combat tab. The Hexblade's Curse is the hero: a target-marking
 * buff that shows its live damage bonus, expanded crit range, and kill-heal, with
 * Armor of Hexes (10th) and Master of Hexes (14th) folded in once it is active.
 * Hex Warrior surfaces the CHA-to-hit link, and Accursed Specter binds a slain
 * soul as a summon. State lives in classFeature.
 */
const ACCENT = 'var(--dnd-class-warlock)';

export default function HexbladeBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const pb = proficiencyBonus(level);
  const chaMod = abilityMod(character.abilities?.CHA || 10);
  const killHeal = Math.max(1, level + chaMod);
  const cursed = !!cf.hexCurseUsed;

  // Accursed Specter (6th)
  const specterTemp = Math.floor(level / 2);
  const specterAtk = 4 + Math.max(0, chaMod);
  const specterBound = !!cf.specterBound;

  const patch = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      {/* Hexblade's Curse — signature marked target */}
      <div className={`dnd-sig ${cursed ? 'dnd-sig--locked' : ''}`} style={{ '--block-accent': ACCENT }}>
        <div className="dnd-sig__token"><Skull size={20} /></div>
        <div className="dnd-sig__body">
          <div className="dnd-sig__title">
            <Skull size={13} /> Hexblade's Curse
            <span className="dnd-warmagic__uses" style={{ marginLeft: 'auto' }}>{cursed ? 'active' : '1 / short or long'}</span>
          </div>
          {cursed && (
            <div className="dnd-sig__target-row">
              <input className="dnd-field dnd-field--sm dnd-sig__target" value={cf.curseTarget || ''} placeholder="Cursed target…"
                onChange={e => patch({ curseTarget: e.target.value })} />
            </div>
          )}
          <div className="dnd-sig__chips">
            <span className={`dnd-sig__chip ${cursed ? 'dnd-sig__chip--on' : ''}`}>+{pb} damage</span>
            <span className={`dnd-sig__chip ${cursed ? 'dnd-sig__chip--on' : ''}`}>crit on 19–20</span>
            <span className={`dnd-sig__chip ${cursed ? 'dnd-sig__chip--on' : ''}`}>+{killHeal} HP on kill</span>
          </div>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend"
              onClick={() => patch({ hexCurseUsed: !cursed, ...(cursed ? { curseTarget: '' } : {}) })}>
              {cursed ? 'End / Reset' : 'Curse'}
            </button>
          </div>
        </div>
      </div>

      <div className="dnd-warmagic__reminders">
        {/* Hex Warrior — CHA weapon link */}
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Swords size={12} />
          <span><strong>Hex Warrior</strong> — proficient with medium armor, shields & martial weapons. Your bonded weapon uses <strong>CHA ({formatMod(chaMod)})</strong> for attack & damage (set on a long rest).</span>
        </div>
        {cursed && level >= 10 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <ShieldCheck size={12} />
            <span><strong>Armor of Hexes</strong> — when the cursed target hits you, reaction: roll a d6; on a 4+ the attack misses.</span>
          </div>
        )}
        {cursed && level >= 14 && (
          <div className="dnd-warmagic__reminder">
            <Crosshair size={12} />
            <span><strong>Master of Hexes</strong> — when the cursed target dies, move the curse to a new creature within 30 ft (no kill-heal that time).</span>
          </div>
        )}
      </div>

      {/* Accursed Specter — bound soul */}
      {level >= 6 && (
        <div className={`dnd-sig ${specterBound ? 'dnd-sig--locked' : 'dnd-sig--empty'}`} style={{ '--block-accent': ACCENT }}>
          <div className="dnd-sig__token"><Ghost size={20} /></div>
          <div className="dnd-sig__body">
            <div className="dnd-sig__title">
              <Ghost size={13} /> Accursed Specter
              <span className="dnd-warmagic__uses" style={{ marginLeft: 'auto' }}>{specterBound ? 'bound' : '1 / long rest'}</span>
            </div>
            <div className="dnd-companion__topline">
              <div className="dnd-companion__stat"><span className="dnd-companion__stat-lbl">AC</span><span className="dnd-companion__stat-val">12</span></div>
              <div className="dnd-companion__stat"><span className="dnd-companion__stat-lbl">HP</span><span className="dnd-companion__stat-val">22</span></div>
              <div className="dnd-companion__stat"><span className="dnd-companion__stat-lbl">Temp</span><span className="dnd-companion__stat-val">+{specterTemp}</span></div>
              <div className="dnd-companion__stat dnd-companion__stat--wide"><span className="dnd-companion__stat-lbl">Speed</span><span className="dnd-companion__stat-val dnd-companion__stat-val--text">fly 50 ft</span></div>
            </div>
            <div className="dnd-companion__action" style={{ borderLeftColor: ACCENT }}>
              <div className="dnd-companion__action-head">
                <span className="dnd-companion__action-name">Life Drain</span>
                <span className="dnd-companion__hit">{formatMod(specterAtk)} to hit</span>
              </div>
              <p className="dnd-companion__damage">3d6 necrotic · CON save or max HP reduced by the damage</p>
            </div>
            <span className="dnd-sig__desc">Slay a humanoid to raise its spirit (rolls own initiative, obeys you). Serves until the end of your next long rest.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => patch({ specterBound: !specterBound })}>
                {specterBound ? 'Dismiss' : 'Bind Specter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
