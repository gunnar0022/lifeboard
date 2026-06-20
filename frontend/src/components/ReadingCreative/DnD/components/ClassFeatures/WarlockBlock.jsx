import { useEffect, useRef } from 'react';
import { Sparkles, BookOpen } from 'lucide-react';
import { proficiencyBonus } from '../../dndUtils';
import { mysticArcanumLevels } from '../../classProgression';

const ARCANUM_ORD = { 6: '6th', 7: '7th', 8: '8th', 9: '9th' };

/**
 * Warlock — Combat tab. Pact slots live on the Spells tab (short-rest recharge),
 * so here we surface the Pact Boon and, for Pact of the Talisman, its
 * proficiency-bonus uses. Mystic Arcanum is a reminder to add granted spells.
 */
export default function WarlockBlock({ classFeature, level, onUpdate }) {
  const cf = classFeature || {};
  const pb = proficiencyBonus(level);
  const boon = cf.pactBoon || '';
  const isTalisman = boon === 'Pact of the Talisman';
  const arcana = mysticArcanumLevels(level);
  const prevPbRef = useRef(null);

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
  const useTalisman = () => {
    if (talisman.current <= 0) return;
    onUpdate({ classFeature: { ...cf, talisman: { ...talisman, current: talisman.current - 1 } } });
  };

  return (
    <div className="dnd-generic-resource dnd-wizard-block">
      <h4 className="dnd-generic-resource__title">Pact Magic</h4>
      <p className="dnd-wizard-block__note">Pact slots (all the same level, short-rest recharge) are on the Spells tab.</p>

      {boon ? (
        <div className="dnd-generic-resource__row" style={{ marginTop: '0.4rem' }}>
          <span><BookOpen size={12} /> <strong>{boon}</strong></span>
        </div>
      ) : (
        <p className="dnd-wizard-block__note">Choose your Pact Boon on the Features tab.</p>
      )}

      {isTalisman && (
        <div className="dnd-generic-resource__row">
          <span>Talisman d4: {talisman.current}/{talisman.max}</span>
          <button className="dnd-generic-resource__btn" onClick={useTalisman} disabled={talisman.current <= 0}>Use</button>
          <span className="dnd-generic-resource__recharge">Long Rest</span>
        </div>
      )}

      {arcana.length > 0 && (
        <p className="dnd-wizard-block__note">
          <Sparkles size={11} /> Mystic Arcanum: {arcana.map(l => ARCANUM_ORD[l]).join(', ')} — add as once/long-rest Granted Spells.
        </p>
      )}
    </div>
  );
}
