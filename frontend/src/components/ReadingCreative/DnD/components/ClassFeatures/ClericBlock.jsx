import { useEffect, useRef } from 'react';
import { Sun, Skull, Sparkles } from 'lucide-react';
import { channelDivinityUses, harnessDivinePowerUses, destroyUndeadCR } from '../../classProgression';

/**
 * Cleric — Combat tab. Channel Divinity (uses scale 1/2/3 by level, short-rest
 * recharge) is the core resource, with the optional Harness Divine Power pool
 * (long-rest). Turn/Destroy Undead and Divine Intervention surface as reminders.
 */
export default function ClericBlock({ classFeature, level, onUpdate }) {
  const cf = classFeature || {};
  const cdMax = channelDivinityUses(level);
  const hdpMax = harnessDivinePowerUses(level);
  const undeadCR = destroyUndeadCR(level);
  const prevCdRef = useRef(null);

  // Keep Channel Divinity max synced to level; grant new use(s) when it rises.
  useEffect(() => {
    const prev = prevCdRef.current;
    prevCdRef.current = cdMax;
    const cur = cf.currentUses;
    if (cf.maxUses !== cdMax || cur == null) {
      const grew = prev !== null && cdMax > prev;
      const currentUses = cur == null ? cdMax
        : grew ? Math.min(cur + (cdMax - (cf.maxUses || 0)), cdMax) : Math.min(cur, cdMax);
      onUpdate({ classFeature: { ...cf, maxUses: cdMax, currentUses } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cdMax]);

  const cdUses = cf.currentUses ?? cdMax;
  const spendCD = () => { if (cdUses > 0) onUpdate({ classFeature: { ...cf, currentUses: cdUses - 1 } }); };
  const restoreCD = () => { if (cdUses < cdMax) onUpdate({ classFeature: { ...cf, currentUses: cdUses + 1 } }); };

  const hdp = cf.harnessDivinePower || { current: hdpMax, max: hdpMax };
  const useHDP = () => { if (hdp.current > 0) onUpdate({ classFeature: { ...cf, harnessDivinePower: { ...hdp, current: hdp.current - 1, max: hdpMax } } }); };

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-cleric)' }}>
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Sun size={13} /> Channel Divinity</h4>
          <span className="dnd-warmagic__uses">{cdUses}/{cdMax}</span>
        </div>
        <div className="dnd-warmagic__pips">
          {Array.from({ length: cdMax }, (_, i) => (
            <span key={i} className={`dnd-warmagic__pip ${i < cdUses ? 'dnd-warmagic__pip--full' : ''}`} />
          ))}
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Turn Undead or a domain effect. Recharges on a short or long rest.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn" onClick={restoreCD} disabled={cdUses >= cdMax}>+</button>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={spendCD} disabled={cdUses <= 0}>Use</button>
          </div>
        </div>
      </div>

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <Skull size={12} />
          <span><strong>Turn Undead</strong> — undead within 30 ft, WIS save or flee 1 min.
          {undeadCR && <> <strong>Destroy Undead</strong>: instantly destroyed if CR ≤ <strong>{undeadCR}</strong>.</>}</span>
        </div>
        {level >= 10 && (
          <div className="dnd-warmagic__reminder">
            <Sparkles size={12} />
            <span><strong>Divine Intervention</strong> — action: roll d100, succeed if ≤ {level}{level >= 20 ? ' (automatic at 20th)' : ''}.</span>
          </div>
        )}
      </div>

      {/* Harness Divine Power (optional) — spends a Channel Divinity use to regain a slot */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle">Harness Divine Power</h4>
          <span className="dnd-warmagic__uses">{hdp.current}/{hdpMax}</span>
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Optional: bonus action, spend a Channel Divinity use to regain a slot. Long-rest pool.</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={useHDP} disabled={hdp.current <= 0}>Use</button>
          </div>
        </div>
      </div>
    </div>
  );
}
