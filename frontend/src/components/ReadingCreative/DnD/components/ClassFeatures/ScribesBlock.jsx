import { useEffect, useRef } from 'react';
import { BookOpen, Ghost, ScrollText, Shield, Palette, Feather } from 'lucide-react';
import { proficiencyBonus } from '../../dndUtils';

const d6 = () => Math.floor(Math.random() * 6) + 1;

/**
 * Order of Scribes — Combat tab. The Manifest Mind is the star: summon your
 * spellbook's spectral consciousness, hover it around the field, and cast through
 * its senses (a proficiency-bonus daily pool). The Awakened Spellbook tracks its
 * once-a-day ritual trick, Master Scrivener holds your dawn-scribed scroll, and
 * One with the Word is the desperate 3d6 spell-burning save.
 */
export default function ScribesBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;
  const pb = proficiencyBonus(level);

  const mind = cf.manifestMind || { active: false, uses: { current: pb, max: pb } };
  const uses = mind.uses || { current: pb, max: pb };
  const ritualUsed = !!cf.awakenedRitualUsed;
  const scroll = cf.masterScroll || { spell: '', used: false };
  const word = cf.oneWithWord || { used: false, lastRoll: null };
  const prevPbRef = useRef(null);

  // Cast-from-mind pool tracks the proficiency bonus.
  useEffect(() => {
    if (level < 6) return;
    const prev = prevPbRef.current;
    prevPbRef.current = pb;
    const u = cf.manifestMind?.uses;
    if (!u || u.max !== pb) {
      const grew = prev !== null && pb > prev;
      const current = u ? (grew ? Math.min((u.current || 0) + (pb - (u.max || 0)), pb) : Math.min(u.current ?? pb, pb)) : pb;
      onUpdate({ classFeature: { ...cf, manifestMind: { ...(cf.manifestMind || {}), active: cf.manifestMind?.active || false, uses: { current, max: pb } } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb, level]);

  const setMind = (next) => onUpdate({ classFeature: { ...cf, manifestMind: { ...mind, uses, ...next } } });
  const manifest = () => setMind({ active: true });
  const dismiss = () => setMind({ active: false });
  const castThrough = () => { if (uses.current > 0) setMind({ uses: { ...uses, current: uses.current - 1 } }); };
  const regainCast = () => { if (uses.current < uses.max) setMind({ uses: { ...uses, current: uses.current + 1 } }); };

  const setScroll = (next) => onUpdate({ classFeature: { ...cf, masterScroll: { ...scroll, ...next } } });
  const rollWord = () => onUpdate({ classFeature: { ...cf, oneWithWord: { used: true, lastRoll: d6() + d6() + d6() } } });
  const resetWord = () => onUpdate({ classFeature: { ...cf, oneWithWord: { used: false, lastRoll: null } } });

  const hasMind = level >= 6;
  const hasScroll = level >= 10;
  const hasWord = level >= 14;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-artificer)' }}>
      {/* Manifest Mind */}
      {hasMind && (
        <div className={`dnd-mind ${mind.active ? 'dnd-mind--manifest' : ''}`}>
          <div className="dnd-mind__orb"><Ghost size={20} /></div>
          <div className="dnd-mind__body">
            <div className="dnd-mind__head">
              <h4 className="dnd-mind__title">Manifest Mind</h4>
              <span className="dnd-warmagic__uses">{uses.current}/{uses.max} casts</span>
            </div>
            <div className="dnd-warmagic__pips">
              {Array.from({ length: uses.max }, (_, i) => (
                <span key={i} className={`dnd-warmagic__pip ${i < uses.current ? 'dnd-warmagic__pip--full' : ''}`} />
              ))}
            </div>
            <span className="dnd-warmagic__note">
              {mind.active
                ? 'Spectral tome hovering (≤60 ft, dim light 10 ft) — cast a spell from its space using its senses.'
                : 'Bonus action: conjure the book\'s mind. Re-conjure before a long rest by expending a slot.'}
            </span>
            <div className="dnd-warmagic__btns dnd-mind__btns">
              {mind.active ? (
                <>
                  <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={castThrough} disabled={uses.current <= 0}>Cast through</button>
                  <button className="dnd-warmagic__btn" onClick={regainCast} disabled={uses.current >= uses.max}>+</button>
                  <button className="dnd-warmagic__btn" onClick={dismiss}>Dismiss</button>
                </>
              ) : (
                <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={manifest}>Manifest (BA)</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Awakened Spellbook — ritual trick */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><BookOpen size={13} /> Awakened Spellbook</h4>
          <span className="dnd-warmagic__uses">{ritualUsed ? 'ritual spent' : 'ritual ready'}</span>
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note"><Palette size={11} style={{ verticalAlign: '-1px' }} /> Swap a spell's damage type for another in your book (same level). Quick ritual: cast at normal time, 1 / long rest.</span>
          <button className="dnd-warmagic__btn dnd-warmagic__btn--spend"
            onClick={() => onUpdate({ classFeature: { ...cf, awakenedRitualUsed: !ritualUsed } })}>
            {ritualUsed ? 'Reset' : 'Use ritual'}
          </button>
        </div>
      </div>

      {/* Master Scrivener — the scroll */}
      {hasScroll && (
        <div className={`dnd-warmagic__section ${scroll.spell && !scroll.used ? 'dnd-scroll--ready' : ''}`}>
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><ScrollText size={13} /> Master Scrivener</h4>
            <span className="dnd-warmagic__uses">{scroll.used ? 'cast' : scroll.spell ? 'scribed' : 'blank'}</span>
          </div>
          {scroll.used ? (
            <div className="dnd-warmagic__row">
              <span className="dnd-warmagic__note">Scroll spent — scribe a new one after a long rest.</span>
            </div>
          ) : (
            <div className="dnd-warmagic__row">
              <input className="dnd-scroll__input" placeholder="1st/2nd-level spell (cast at +1 level)…" value={scroll.spell}
                onChange={(e) => setScroll({ spell: e.target.value })} />
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => setScroll({ used: true })} disabled={!scroll.spell}>Cast</button>
            </div>
          )}
        </div>
      )}

      {/* One with the Word — the gambit */}
      {hasWord && (
        <div className={`dnd-wordburn ${word.used ? 'dnd-wordburn--spent' : ''}`}>
          <div className="dnd-wordburn__head">
            <h4 className="dnd-wordburn__title"><Shield size={14} /> One with the Word</h4>
            <span className="dnd-warmagic__uses">{word.used ? 'spent' : 'ready'}</span>
          </div>
          {word.used && word.lastRoll != null ? (
            <span className="dnd-warmagic__note">Damage negated — burn spells totaling <strong>≥ {word.lastRoll} levels</strong> from your book (lost for 1d6 long rests). Advantage on Arcana while the book is on you.</span>
          ) : (
            <span className="dnd-warmagic__note">Reaction (mind manifested): dismiss it to prevent all damage to you, then roll 3d6 to burn spells. Advantage on Arcana while the book is on you.</span>
          )}
          <div className="dnd-warmagic__btns">
            {word.used
              ? <button className="dnd-warmagic__btn" onClick={resetWord}>Reset</button>
              : <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={rollWord}>Dismiss &amp; roll 3d6</button>}
          </div>
        </div>
      )}

      {/* Reminders */}
      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <Feather size={12} />
          <span><strong>Wizardly Quill</strong> — bonus action: conjure an inkless quill; copy spells in 2 min/level and erase your own writing within 5 ft.</span>
        </div>
      </div>
    </div>
  );
}
