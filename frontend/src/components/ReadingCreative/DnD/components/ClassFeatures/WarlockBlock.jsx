import { useEffect, useRef } from 'react';
import { Sparkles, BookOpen, Sword, PawPrint, Gem, Star, ScrollText, Wand2, Hexagon } from 'lucide-react';
import { proficiencyBonus } from '../../dndUtils';
import { mysticArcanumLevels, PACT_BOONS } from '../../classProgression';

const ARCANUM_ORD = { 6: '6th', 7: '7th', 8: '8th', 9: '9th' };

/**
 * Warlock — Combat tab. Pact slots live on the Spells tab (short-rest recharge),
 * so this block makes the Pact Boon the glowing centerpiece: each boon shows its
 * full mechanics plus a boon-specific control (conjure the blade, pick a familiar,
 * fill the Book of Shadows, or spend the talisman's d4s). Below it, Mystic Arcanum
 * is a per-level once/long-rest caster and the chosen Eldritch Invocations are
 * surfaced from the Features tab so they're readable in play.
 */

// Per-boon icons (sigil for the title, larger glyph for the sigil token); the
// tagline + mechanics points come from the shared PACT_BOONS data.
const BOON_ICONS = {
  'Pact of the Blade': { icon: <Sword size={22} />, sigil: <Sword size={13} /> },
  'Pact of the Chain': { icon: <PawPrint size={22} />, sigil: <PawPrint size={13} /> },
  'Pact of the Tome': { icon: <BookOpen size={22} />, sigil: <BookOpen size={13} /> },
  'Pact of the Talisman': { icon: <Gem size={22} />, sigil: <Gem size={13} /> },
  'Pact of the Star Chain (UA)': { icon: <Star size={22} />, sigil: <Star size={13} /> },
};

const FAMILIAR_FORMS = ['Imp', 'Pseudodragon', 'Quasit', 'Sprite', 'Normal form'];

export default function WarlockBlock({ character, classFeature, level, onUpdate }) {
  const cf = classFeature || character?.classFeature || {};
  const lvl = level || character?.meta?.level || 1;
  const pb = proficiencyBonus(lvl);
  const boon = cf.pactBoon || '';
  const boonData = PACT_BOONS.find(b => b.name === boon);
  const detail = boonData ? { ...boonData, ...(BOON_ICONS[boon] || {}) } : null;
  const boonKey = boon ? boon.replace(/[^a-z]/gi, '').toLowerCase() : 'none';
  const isTalisman = boon === 'Pact of the Talisman';
  const arcana = mysticArcanumLevels(lvl);
  const invocations = (cf.invocations || []).filter(i => (i.name || '').trim());
  const prevPbRef = useRef(null);

  const patch = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });

  // Keep Talisman uses synced to proficiency bonus.
  useEffect(() => {
    if (!isTalisman) return;
    const prev = prevPbRef.current;
    prevPbRef.current = pb;
    const t = cf.talisman;
    if (!t || t.max !== pb) {
      const grew = prev !== null && pb > prev;
      const current = t
        ? (grew ? Math.min((t.current || 0) + (pb - (t.max || 0)), pb) : Math.min(t.current ?? pb, pb))
        : pb;
      onUpdate({ classFeature: { ...cf, talisman: { current, max: pb } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb, isTalisman]);

  const talisman = cf.talisman || { current: pb, max: pb };
  const book = cf.bookOfShadows || ['', '', ''];
  const arcanum = cf.mysticArcanum || {};

  const setBookCantrip = (i, v) => patch({ bookOfShadows: book.map((c, idx) => idx === i ? v : c) });
  const setArcanum = (l, fields) => patch({ mysticArcanum: { ...arcanum, [l]: { ...(arcanum[l] || {}), ...fields } } });

  return (
    <div className="dnd-warlock">
      {/* Pact Magic note */}
      <p className="dnd-warlock__slots-note">
        <Hexagon size={11} /> Pact slots (all the same level, short-rest recharge) live on the <strong>Spells</strong> tab.
      </p>

      {/* ── Pact Boon centerpiece ── */}
      {detail ? (
        <div className={`dnd-warlock__pact dnd-warlock__pact--${boonKey}`}>
          <div className="dnd-warlock__sigil">{detail.icon}</div>
          <div className="dnd-warlock__pact-body">
            <div className="dnd-warlock__pact-head">
              <span className="dnd-warlock__eyebrow">Pact Boon</span>
              <h4 className="dnd-warlock__pact-title">{detail.sigil} {boon}</h4>
            </div>
            <p className="dnd-warlock__pact-tagline">{detail.tagline}</p>
            <ul className="dnd-warlock__points">
              {detail.points.map((p, i) => <li key={i}>{p}</li>)}
            </ul>

            {/* Boon-specific control */}
            {boon === 'Pact of the Blade' && (
              <div className="dnd-warlock__boon-tool">
                <input className="dnd-field dnd-field--sm dnd-warlock__weapon-form" value={cf.pactWeaponForm || ''}
                  placeholder="Weapon form…" onChange={e => patch({ pactWeaponForm: e.target.value })} style={{ width: 'auto', flex: 1, textAlign: 'left' }} />
                <button className={`dnd-warlock__conjure ${cf.pactWeaponActive ? 'dnd-warlock__conjure--on' : ''}`}
                  onClick={() => patch({ pactWeaponActive: !cf.pactWeaponActive })}>
                  {cf.pactWeaponActive ? 'Dismiss' : 'Conjure'}
                </button>
              </div>
            )}
            {boon === 'Pact of the Chain' && (
              <div className="dnd-warlock__boon-tool">
                <span className="dnd-warlock__tool-lbl">Familiar</span>
                <select className="dnd-field dnd-warlock__familiar" value={cf.familiarForm || ''}
                  onChange={e => patch({ familiarForm: e.target.value })}>
                  <option value="">— form —</option>
                  {FAMILIAR_FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            )}
            {boon === 'Pact of the Tome' && (
              <div className="dnd-warlock__book">
                <span className="dnd-warlock__tool-lbl">Book of Shadows — at-will cantrips</span>
                <div className="dnd-warlock__book-rows">
                  {[0, 1, 2].map(i => (
                    <input key={i} className="dnd-field dnd-warlock__book-input" value={book[i] || ''}
                      placeholder={`Cantrip ${i + 1}`} onChange={e => setBookCantrip(i, e.target.value)} />
                  ))}
                </div>
              </div>
            )}
            {isTalisman && (
              <div className="dnd-warlock__boon-tool">
                <span className="dnd-warlock__tool-lbl">Talisman d4</span>
                <div className="dnd-warmagic__pips" style={{ margin: 0 }}>
                  {Array.from({ length: talisman.max }, (_, i) => (
                    <span key={i} className={`dnd-warmagic__pip ${i < talisman.current ? 'dnd-warmagic__pip--full' : ''}`} style={{ '--block-accent': 'var(--dnd-class-warlock)' }} />
                  ))}
                </div>
                <span className="dnd-warlock__uses">{talisman.current}/{talisman.max}</span>
                <button className="dnd-warlock__conjure" onClick={() => talisman.current > 0 && patch({ talisman: { ...talisman, current: talisman.current - 1 } })} disabled={talisman.current <= 0}>Add d4</button>
                <button className="dnd-warlock__mini" onClick={() => talisman.current < talisman.max && patch({ talisman: { ...talisman, current: talisman.current + 1 } })} disabled={talisman.current >= talisman.max}>+</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="dnd-warlock__pact dnd-warlock__pact--none">
          <div className="dnd-warlock__sigil"><Hexagon size={22} /></div>
          <div className="dnd-warlock__pact-body">
            <span className="dnd-warlock__eyebrow">Pact Boon</span>
            <p className="dnd-warlock__pact-tagline">Choose your Pact Boon on the <strong>Features</strong> tab to bind its power here.</p>
          </div>
        </div>
      )}

      {/* ── Mystic Arcanum ── */}
      {arcana.length > 0 && (
        <div className="dnd-warlock__arcanum">
          <h4 className="dnd-warlock__section-title"><Sparkles size={13} /> Mystic Arcanum</h4>
          <p className="dnd-warlock__hint">One spell of each level below, cast without a slot — once per long rest.</p>
          {arcana.map(l => {
            const a = arcanum[l] || {};
            return (
              <div key={l} className={`dnd-warlock__arcanum-row ${a.used ? 'dnd-warlock__arcanum-row--spent' : ''}`}>
                <span className="dnd-warlock__arcanum-lvl">{ARCANUM_ORD[l]}</span>
                <input className="dnd-field dnd-warlock__arcanum-input" value={a.spell || ''}
                  placeholder={`${ARCANUM_ORD[l]}-level spell…`} onChange={e => setArcanum(l, { spell: e.target.value })} />
                <button className={`dnd-warlock__cast ${a.used ? 'dnd-warlock__cast--spent' : ''}`}
                  onClick={() => setArcanum(l, { used: !a.used })}>
                  {a.used ? 'Spent' : 'Cast'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Eldritch Invocations ── */}
      <div className="dnd-warlock__invocations">
        <h4 className="dnd-warlock__section-title"><ScrollText size={13} /> Eldritch Invocations</h4>
        {invocations.length > 0 ? (
          <div className="dnd-warlock__inv-list">
            {invocations.map((inv, i) => (
              <div key={i} className="dnd-warlock__inv">
                <span className="dnd-warlock__inv-name"><Wand2 size={11} /> {inv.name}</span>
                {inv.desc && <p className="dnd-warlock__inv-desc">{inv.desc}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="dnd-warlock__hint">Add your invocations on the <strong>Features</strong> tab — they'll appear here for quick reference.</p>
        )}
      </div>
    </div>
  );
}
