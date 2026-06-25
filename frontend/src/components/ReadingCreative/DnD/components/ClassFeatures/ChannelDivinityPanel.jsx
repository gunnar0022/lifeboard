import { Sun } from 'lucide-react';

/**
 * ChannelDivinityPanel — shared Combat-tab core for paladin oaths. Paladin
 * subclasses are flavor-heavy but mechanically light: their combat hook is the
 * two Channel Divinity options each oath grants. This panel shows the shared
 * Channel Divinity charge (cf.channelDivinity, the same pool PaladinBlock and
 * the rest handlers manage) and lets each option spend it directly, so the
 * resource and its uses live in one place. Pass the oath's options as
 * `[{ name, icon, desc }]`.
 *
 * `source` selects which pool the charges live in: 'paladin' (default) uses the
 * nested cf.channelDivinity; 'cleric' uses the flat cf.currentUses / cf.maxUses
 * pool that ClericBlock manages, so cleric domain options spend the same charges.
 */
export default function ChannelDivinityPanel({ character, onUpdate, options, source = 'paladin' }) {
  const cf = character.classFeature || {};
  const cd = source === 'cleric'
    ? { current: cf.currentUses ?? cf.maxUses ?? 1, max: cf.maxUses ?? 1 }
    : (cf.channelDivinity || { current: 1, max: 1 });
  const setCurrent = (current) => onUpdate({
    classFeature: {
      ...cf,
      ...(source === 'cleric' ? { currentUses: current } : { channelDivinity: { ...cd, current } }),
    },
  });

  return (
    <div className="dnd-cd">
      <div className="dnd-cd__bar">
        <span className="dnd-cd__title"><Sun size={14} /> Channel Divinity</span>
        <div className="dnd-cd__meter">
          <div className="dnd-warmagic__pips">
            {Array.from({ length: cd.max }, (_, i) => (
              <span key={i} className={`dnd-warmagic__pip ${i < cd.current ? 'dnd-warmagic__pip--full' : ''}`} />
            ))}
          </div>
          <span className="dnd-warmagic__uses">{cd.current}/{cd.max}</span>
          <button className="dnd-warmagic__btn" onClick={() => setCurrent(Math.min(cd.max, cd.current + 1))}
            disabled={cd.current >= cd.max} title="Restore a use">+</button>
        </div>
      </div>

      <div className="dnd-cd__options">
        {options.map(o => (
          <div key={o.name} className="dnd-cd__option">
            <div className="dnd-cd__opt-head">
              <span className="dnd-cd__opt-name">{o.icon} {o.name}</span>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" disabled={cd.current <= 0}
                onClick={() => setCurrent(Math.max(0, cd.current - 1))}>Use</button>
            </div>
            <p className="dnd-cd__opt-desc">{o.desc}</p>
          </div>
        ))}
      </div>

      <span className="dnd-cd__foot">Recharges on a short or long rest.</span>
    </div>
  );
}
