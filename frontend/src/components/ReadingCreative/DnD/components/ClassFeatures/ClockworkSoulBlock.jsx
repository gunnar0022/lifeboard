import { useEffect, useRef } from 'react';
import { Scale, Shield, Clock, Sparkles } from 'lucide-react';
import { proficiencyBonus } from '../../dndUtils';

/**
 * Clockwork Soul — Combat tab. Restore Balance is a proficiency-sized reaction pool
 * (long rest). Bastion of Law is a live d8 ward you build by spending sorcery points
 * (1–5) and expend to soak damage. Trance of Order and Clockwork Cavalcade are
 * long-rest plays (or extra SP). Sorcery points are tracked on the base card above.
 */
export default function ClockworkSoulBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const pb = proficiencyBonus(level);
  const sp = cf.currentPoints ?? 0;
  const prevPbRef = useRef(null);

  const balance = cf.restoreBalance || { max: pb, current: pb };
  const ward = cf.bastionWard?.dice || 0;
  const tranceUsed = cf.tranceUsed || false;
  const cavalcadeUsed = cf.cavalcadeUsed || false;

  // Restore Balance pool tracks the proficiency bonus.
  useEffect(() => {
    const prev = prevPbRef.current;
    prevPbRef.current = pb;
    const r = cf.restoreBalance;
    if (!r || r.max !== pb) {
      const grew = prev !== null && pb > prev;
      const current = r ? (grew ? Math.min((r.current || 0) + (pb - (r.max || 0)), pb) : Math.min(r.current ?? pb, pb)) : pb;
      onUpdate({ classFeature: { ...cf, restoreBalance: { max: pb, current } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb]);

  const spendSP = (n) => { if (sp >= n) onUpdate({ classFeature: { ...cf, currentPoints: sp - n } }); };
  const useBalance = () => { if (balance.current > 0) onUpdate({ classFeature: { ...cf, restoreBalance: { ...balance, current: balance.current - 1 } } }); };
  const restoreBalanceUse = () => { if (balance.current < balance.max) onUpdate({ classFeature: { ...cf, restoreBalance: { ...balance, current: balance.current + 1 } } }); };
  const addWard = () => { if (ward < 5 && sp >= 1) onUpdate({ classFeature: { ...cf, currentPoints: sp - 1, bastionWard: { dice: ward + 1 } } }); };
  const expendWard = () => { if (ward > 0) onUpdate({ classFeature: { ...cf, bastionWard: { dice: ward - 1 } } }); };
  const clearWard = () => onUpdate({ classFeature: { ...cf, bastionWard: { dice: 0 } } });

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-sorcerer)' }}>
      {/* Restore Balance */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Scale size={13} /> Restore Balance</h4>
          <span className="dnd-warmagic__uses">{balance.current}/{balance.max}</span>
        </div>
        <div className="dnd-warmagic__pips">
          {Array.from({ length: balance.max }, (_, i) => (
            <span key={i} className={`dnd-warmagic__pip ${i < balance.current ? 'dnd-warmagic__pip--full' : ''}`} />
          ))}
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Reaction: cancel advantage/disadvantage on a d20 within 60 ft. Refills on a long rest.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn" onClick={restoreBalanceUse} disabled={balance.current >= balance.max}>+</button>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={useBalance} disabled={balance.current <= 0}>Use</button>
          </div>
        </div>
      </div>

      {/* Bastion of Law */}
      {level >= 6 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Shield size={13} /> Bastion of Law</h4>
            <span className="dnd-warmagic__uses">{ward}d8</span>
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Spend 1–5 SP to ward a creature with that many d8s; expend dice to reduce damage. Lasts until a long rest or re-cast.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={addWard} disabled={ward >= 5 || sp < 1} title="Add a d8 for 1 SP">+d8</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={expendWard} disabled={ward <= 0}>Soak</button>
              {ward > 0 && <button className="dnd-warmagic__btn" onClick={clearWard}>Clear</button>}
            </div>
          </div>
        </div>
      )}

      <div className="dnd-warmagic__reminders">
        {level >= 14 && (
          <div className={`dnd-warmagic__reminder ${tranceUsed ? 'dnd-archfey__spent' : ''}`}>
            <Clock size={12} />
            <span><strong>Trance of Order</strong> — 1 min: foes can't get advantage on you, and you treat d20 rolls of 9 or lower as 10. {tranceUsed ? '(spent)' : '1 / long rest.'}</span>
            <div className="dnd-warmagic__btns">
              {tranceUsed
                ? <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => spendSP(5)} disabled={sp < 5}>−5 SP</button>
                : <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => onUpdate({ classFeature: { ...cf, tranceUsed: true } })}>Use</button>}
            </div>
          </div>
        )}
        {level >= 18 && (
          <div className={`dnd-warmagic__reminder ${cavalcadeUsed ? 'dnd-archfey__spent' : ''}`}>
            <Sparkles size={12} />
            <span><strong>Clockwork Cavalcade</strong> — 30-ft cube: restore up to 100 HP, repair objects, end spells ≤6th. {cavalcadeUsed ? '(spent)' : '1 / long rest.'}</span>
            <div className="dnd-warmagic__btns">
              {cavalcadeUsed
                ? <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => spendSP(7)} disabled={sp < 7}>−7 SP</button>
                : <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => onUpdate({ classFeature: { ...cf, cavalcadeUsed: true } })}>Use</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
