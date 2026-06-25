import { useEffect, useRef } from 'react';
import { Moon, Sparkles, Wand2, Flame } from 'lucide-react';
import { abilityMod, proficiencyBonus } from '../../dndUtils';

/**
 * Lunar Sorcery — Combat tab. The chosen lunar phase is the centerpiece: a trio
 * of moon buttons that recolor everything beneath them — the free 1st-level lunar
 * cast, the Metamagic school discount (Lunar Boons), the 14th-level empowerment,
 * and the 18th-level Phenomenon burst. Sorcery points live on the base Sorcerer
 * card. State lives in classFeature.
 */
const ACCENT = 'var(--dnd-class-sorcerer)';
const ORDER = ['full', 'new', 'crescent'];

const LUNAR_SPELLS = {
  full: { 1: 'Shield', 3: 'Lesser Restoration', 5: 'Dispel Magic', 7: 'Death Ward', 9: "Rary's Telepathic Bond" },
  new: { 1: 'Ray of Sickness', 3: 'Blindness/Deafness', 5: 'Vampiric Touch', 7: 'Confusion', 9: 'Hold Monster' },
  crescent: { 1: 'Color Spray', 3: 'Alter Self', 5: 'Phantom Steed', 7: 'Hallucinatory Terrain', 9: 'Mislead' },
};
const PHASE = {
  full: {
    label: 'Full Moon', schools: 'Abjuration & Divination',
    empower: 'Bonus action: shed or douse bright light (10 ft). You and chosen allies have advantage on Investigation & Perception within it.',
    phenom: 'Creatures within 30 ft: CON save or blinded until their next turn. One creature regains 3d8 HP.',
  },
  new: {
    label: 'New Moon', schools: 'Enchantment & Necromancy',
    empower: 'Advantage on Stealth checks. While fully in darkness, attack rolls against you have disadvantage.',
    phenom: 'Creatures within 30 ft: DEX save or 3d10 necrotic and speed 0 until their next turn. You become invisible until your next turn.',
  },
  crescent: {
    label: 'Crescent Moon', schools: 'Illusion & Transmutation',
    empower: 'Resistance to necrotic and radiant damage.',
    phenom: 'Teleport up to 60 ft (bring one willing ally within 5 ft). You both gain resistance to all damage until your next turn.',
  },
};

export default function LunarSorceryBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const pb = proficiencyBonus(level);
  const chaMod = abilityMod(character.abilities?.CHA || 10);
  const saveDC = 8 + pb + chaMod;
  const phase = cf.lunarPhase || 'full';
  const meta = PHASE[phase];
  const freeCast = cf.lunarFreeCast || {};
  const phenomUsed = !!cf.lunarPhenomenonUsed;
  const sp = cf.currentPoints ?? 0;
  const prevPb = useRef(null);

  const patch = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });

  // Lunar Boons (6th): discount pool keyed to proficiency bonus.
  useEffect(() => {
    if (level < 6) return;
    const p = prevPb.current;
    prevPb.current = pb;
    if (cf.lunarBoons?.max !== pb) {
      const stored = cf.lunarBoons?.current;
      const next = stored == null ? pb
        : (p != null && pb > p ? Math.min(stored + (pb - p), pb) : Math.min(stored, pb));
      onUpdate({ classFeature: { ...cf, lunarBoons: { max: pb, current: next } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb, level]);

  const boons = cf.lunarBoons || { current: pb, max: pb };
  const stepBoons = (d) => patch({ lunarBoons: { ...boons, current: Math.max(0, Math.min(boons.max, boons.current + d)) } });
  const spend = (n, fields = {}) => { if (sp >= n) patch({ currentPoints: sp - n, ...fields }); };

  return (
    <div className="dnd-lunar" style={{ '--block-accent': ACCENT }}>
      {/* Phase selector */}
      <div className="dnd-lunar__phases">
        {ORDER.map(p => (
          <button key={p}
            className={`dnd-lunar__phase ${phase === p ? 'dnd-lunar__phase--active' : ''}`}
            onClick={() => patch({ lunarPhase: p })}>
            <span className={`dnd-moon dnd-moon--${p}`} />
            <span className="dnd-lunar__phase-name">{PHASE[p].label}</span>
          </button>
        ))}
      </div>
      <p className="dnd-lunar__swap-note">
        Chosen on a long rest.{level >= 6 ? ' Bonus action + 1 SP to swap phase (Waxing and Waning).' : ''}
      </p>

      {/* Lunar spells for the current phase + free cast */}
      <div className="dnd-lunar__card">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-lunar__card-title"><Moon size={13} /> {meta.label} Spells</h4>
        </div>
        <div className="dnd-warmagic__grant">
          {[1, 3, 5, 7, 9].map(l => (
            <div key={l} className={`dnd-warmagic__grant-row ${level >= l ? '' : 'dnd-warmagic__grant-row--locked'}`}>
              <span className="dnd-warmagic__grant-lvl">L{l}</span>
              <span className="dnd-warmagic__grant-names">{LUNAR_SPELLS[phase][l]}</span>
            </div>
          ))}
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Free 1st-level cast: <strong>{LUNAR_SPELLS[phase][1]}</strong> {freeCast[phase] ? '(spent)' : '— once per long rest'}.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend"
              onClick={() => patch({ lunarFreeCast: { ...freeCast, [phase]: !freeCast[phase] } })}>
              {freeCast[phase] ? 'Reset' : 'Cast Free'}
            </button>
          </div>
        </div>
      </div>

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Flame size={12} />
          <span><strong>Moon Fire</strong> — know Sacred Flame; you can target one creature or two within 5 ft of each other.</span>
        </div>
        {level >= 14 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Sparkles size={12} />
            <span><strong>Lunar Empowerment ({meta.label})</strong> — {meta.empower}</span>
          </div>
        )}
      </div>

      {/* Lunar Boons — metamagic discount pool */}
      {level >= 6 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Wand2 size={13} /> Lunar Boons</h4>
            <span className="dnd-warmagic__uses">{boons.current}/{boons.max}</span>
          </div>
          <div className="dnd-warmagic__pips">
            {Array.from({ length: boons.max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < boons.current ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Reduce Metamagic cost by 1 SP on a <strong>{meta.schools}</strong> spell (your phase's schools).</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={() => stepBoons(1)} disabled={boons.current >= boons.max}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => stepBoons(-1)} disabled={boons.current <= 0}>Use</button>
            </div>
          </div>
        </div>
      )}

      {/* Lunar Phenomenon — phase burst */}
      {level >= 18 && (
        <div className={`dnd-warmagic__section ${phenomUsed ? 'dnd-archfey__spent' : ''}`}>
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Moon size={13} /> Lunar Phenomenon</h4>
            <span className="dnd-warmagic__uses">{phenomUsed ? 'spent' : '1 / long rest'}</span>
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note"><strong>{meta.label}</strong> (save DC {saveDC}): {meta.phenom}</span>
            <div className="dnd-warmagic__btns">
              {phenomUsed
                ? <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => spend(5)} disabled={sp < 5} title="Use again for 5 SP">−5 SP</button>
                : <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => patch({ lunarPhenomenonUsed: true })}>Use</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
