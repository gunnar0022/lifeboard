import { Ghost, Sparkles, BookMarked, Wand2 } from 'lucide-react';
import { bardicInspirationDie } from '../../classProgression';

/**
 * College of Spirits — Combat tab. The centerpiece is Tales from Beyond: spend a
 * Bardic Inspiration die (tracked on the base Bard card) to roll on the Spirit Tales
 * table — but you roll your *inspiration die*, so the high tales only open up as the
 * die grows. The rolled tale is retained until bestowed or you rest. At 14th
 * (Mystical Connection) you roll twice and choose; doubles let you pick any tale.
 * Spirit Session is a once-per-long-rest ritual. Accent: spectral teal.
 */
const TALES = {
  1: ['Clever Animal', d => `Target adds an extra ${d} to INT/WIS/CHA checks for 10 min.`],
  2: ['Renowned Duelist', d => `Melee spell attack; on a hit, 2×${d} + CHA force damage.`],
  3: ['Beloved Friends', d => `Target + one ally within 5 ft each gain ${d} + CHA temp HP.`],
  4: ['Runaway', () => `Target teleports 30 ft (reaction); up to CHA allies within 30 ft may follow.`],
  5: ['Avenger', d => `For 1 min, creatures that hit the target in melee take ${d} force.`],
  6: ['Traveler', d => `Target gains ${d} + bard level temp HP, +10 ft speed, +1 AC while they last.`],
  7: ['Beguiler', d => `WIS save or 2×${d} psychic and incapacitated until end of its next turn.`],
  8: ['Phantom', d => `Target invisible until it attacks; that hit deals ${d} necrotic + frightens.`],
  9: ['Brute', d => `Creatures of target's choice within 30 ft: STR save, 3×${d} thunder + prone (half, no prone on success).`],
  10: ['Dragon', d => `30-ft cone, DEX save, 4×${d} fire (half on success).`],
  11: ['Angel', d => `Target heals 2×${d} + CHA; end one of blinded/deafened/paralyzed/petrified/poisoned.`],
  12: ['Mind-Bender', d => `INT save or 3×${d} psychic and stunned until end of its next turn.`],
};

export default function SpiritsBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const die = bardicInspirationDie(level);
  const dieMax = parseInt(die.slice(1), 10);
  const controlled = level >= 14;
  const hasSession = level >= 6;
  const hasFocusBonus = level >= 6;
  const inspLeft = cf.currentUses ?? 0;

  const tale = cf.spiritTale || { current: null, options: null, bestowed: false };
  const sessionUsed = cf.spiritSessionUsed || false;

  const rollIn = () => Math.floor(Math.random() * dieMax) + 1;
  const buildTale = () => {
    if (controlled) {
      const a = rollIn(), b = rollIn();
      return a === b
        ? { current: null, options: Array.from({ length: dieMax }, (_, i) => i + 1), bestowed: false }
        : { current: null, options: [a, b], bestowed: false };
    }
    return { current: rollIn(), options: null, bestowed: false };
  };

  // Rolling a tale expends one Bardic Inspiration use (tracked on the base card).
  const roll = () => {
    if (inspLeft <= 0) return;
    onUpdate({ classFeature: { ...cf, currentUses: inspLeft - 1, spiritTale: buildTale() } });
  };
  const choose = (n) => onUpdate({ classFeature: { ...cf, spiritTale: { current: n, options: null, bestowed: false } } });
  const bestow = () => onUpdate({ classFeature: { ...cf, spiritTale: { ...tale, bestowed: true } } });

  const taleCard = (n) => {
    const [name, fn] = TALES[n];
    return { name, text: fn(die) };
  };

  return (
    <div className="dnd-bardsub" style={{ '--accent': '#52b6a6' }}>
      {/* Tales from Beyond */}
      <div className="dnd-bardsub__card dnd-bardsub__card--hero">
        <div className="dnd-bardsub__head">
          <span className="dnd-bardsub__title"><Ghost size={13} /> Tales from Beyond</span>
          <span className="dnd-bardsub__die">{die}</span>
        </div>

        {tale.options ? (
          <>
            <p className="dnd-bardsub__prompt">{controlled ? 'Choose your tale:' : 'The spirits speak:'}</p>
            <div className="dnd-bardsub__choices">
              {tale.options.map((n, i) => {
                const t = taleCard(n);
                return (
                  <button key={`${n}-${i}`} className="dnd-bardsub__choice" onClick={() => choose(n)}>
                    <span className="dnd-bardsub__choice-num">{n}</span>
                    <span className="dnd-bardsub__choice-text"><strong>{t.name}.</strong> {t.text}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : tale.current ? (
          <div className={`dnd-bardsub__result ${tale.bestowed ? 'dnd-bardsub__result--spent' : ''}`}>
            <span className="dnd-bardsub__result-num">{tale.current}</span>
            <div className="dnd-bardsub__result-body">
              <span className="dnd-bardsub__result-text"><strong>{taleCard(tale.current).name}.</strong> {taleCard(tale.current).text}</span>
              {tale.bestowed
                ? <span className="dnd-bardsub__hint">Bestowed — roll again to retell.</span>
                : <button className="dnd-bardsub__btn dnd-bardsub__btn--spend dnd-bardsub__btn--inline" onClick={bestow}>Bestow (action)</button>}
            </div>
          </div>
        ) : (
          <p className="dnd-bardsub__note">Bonus action while holding your focus: spend a die to channel a tale (retained until bestowed or you rest).</p>
        )}

        <div className="dnd-bardsub__roll-row">
          <button className="dnd-bardsub__roll" onClick={roll} disabled={inspLeft <= 0}>
            {controlled ? `Roll ${die} ×2` : `Roll ${die}`}
          </button>
          <span className="dnd-bardsub__hint">{inspLeft} inspiration left</span>
        </div>
      </div>

      {/* Spirit Session */}
      {hasSession && (
        <div className={`dnd-bardsub__card ${sessionUsed ? 'dnd-bardsub__card--spent' : ''}`}>
          <div className="dnd-bardsub__head">
            <span className="dnd-bardsub__title"><BookMarked size={13} /> Spirit Session</span>
            <span className="dnd-bardsub__badge">1 / long rest</span>
          </div>
          <div className="dnd-bardsub__row">
            <span className="dnd-bardsub__note">Hour-long ritual (on a rest): temporarily learn a Divination/Necromancy spell of level ≤ participants.</span>
            <div className="dnd-bardsub__btns">
              {sessionUsed && <button className="dnd-bardsub__btn" onClick={() => onUpdate({ classFeature: { ...cf, spiritSessionUsed: false } })}>Reset</button>}
              <button className="dnd-bardsub__btn dnd-bardsub__btn--spend" onClick={() => onUpdate({ classFeature: { ...cf, spiritSessionUsed: true } })} disabled={sessionUsed}>{sessionUsed ? 'Spent' : 'Channel'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="dnd-bardsub__reminders">
        <div className="dnd-bardsub__reminder">
          <Sparkles size={12} />
          <span><strong>Spiritual Focus</strong> — candle, crystal ball, skull, spirit board, or tarokka deck.
          {hasFocusBonus && <> Damaging/healing bard spells through it gain a <strong>+d6</strong> to one roll.</>}</span>
        </div>
        {controlled && (
          <div className="dnd-bardsub__reminder">
            <Wand2 size={12} />
            <span><strong>Mystical Connection</strong> — roll twice and choose; doubles let you pick any tale.</span>
          </div>
        )}
      </div>
    </div>
  );
}
