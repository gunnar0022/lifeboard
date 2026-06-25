import { useEffect, useRef } from 'react';
import { Sun, Skull, Sparkles, HandHeart } from 'lucide-react';
import { channelDivinityUses, harnessDivinePowerUses, destroyUndeadCR } from '../../classProgression';

/**
 * Cleric — Combat tab. Reworked into a radiant "Divine Conduit": Channel
 * Divinity is the centerpiece, shown as a glowing halo of charges (scaling
 * 1/2/3 by level, short-rest recharge) that the domain options on the subclass
 * block draw from. Turn/Destroy Undead and Divine Intervention ride as reminders,
 * with the optional Harness Divine Power pool below. The warm golden glow is the
 * shared "healer" visual language the cleric domains echo.
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
    <div className="dnd-warmagic dnd-cleric" style={{ '--block-accent': 'var(--dnd-class-cleric)' }}>
      {/* ── Divine Conduit — Channel Divinity ── */}
      <div className={`dnd-cleric__conduit ${cdUses > 0 ? 'dnd-cleric__conduit--charged' : ''}`}>
        <div className="dnd-cleric__halo"><Sun size={22} /></div>
        <div className="dnd-cleric__conduit-body">
          <div className="dnd-cleric__conduit-head">
            <span className="dnd-cleric__conduit-title">Channel Divinity</span>
            <span className="dnd-cleric__conduit-num">{cdUses}<span className="dnd-cleric__conduit-max">/{cdMax}</span></span>
          </div>
          <div className="dnd-cleric__orbs">
            {Array.from({ length: cdMax }, (_, i) => (
              <span key={i} className={`dnd-cleric__orb ${i < cdUses ? 'dnd-cleric__orb--lit' : ''}`} />
            ))}
          </div>
          <div className="dnd-cleric__conduit-foot">
            <span className="dnd-warmagic__note">Turn Undead or a domain option (subclass block). Short or long rest.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn" onClick={restoreCD} disabled={cdUses >= cdMax}>+</button>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={spendCD} disabled={cdUses <= 0}>Use</button>
            </div>
          </div>
        </div>
      </div>

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Skull size={12} />
          <span><strong>Turn Undead</strong> — action: undead within 30 ft that see/hear you make a WIS save or flee for 1 min.
          {undeadCR && <> <strong>Destroy Undead</strong>: those with CR ≤ <strong>{undeadCR}</strong> are destroyed instead.</>}</span>
        </div>
        {level >= 10 && (
          <div className="dnd-warmagic__reminder">
            <Sparkles size={12} />
            <span><strong>Divine Intervention</strong> — action: roll d100, succeed if ≤ {level}{level >= 20 ? ' (automatic at 20th)' : ''}. Once successful, recharge after 7 days.</span>
          </div>
        )}
      </div>

      {/* Harness Divine Power (optional) — spends a Channel Divinity use to regain a slot */}
      {hdpMax > 0 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><HandHeart size={13} /> Harness Divine Power</h4>
            <span className="dnd-warmagic__uses">{hdp.current}/{hdpMax}</span>
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Optional: bonus action, spend a Channel Divinity use to regain a spell slot. Long-rest pool.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={useHDP} disabled={hdp.current <= 0}>Use</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
