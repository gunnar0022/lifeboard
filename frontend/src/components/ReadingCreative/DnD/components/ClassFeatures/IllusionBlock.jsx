import { Copy, Box, Shuffle, Sparkles } from 'lucide-react';

/**
 * School of Illusion — Combat tab. Illusory Self is the centerpiece: a phantom
 * double you throw up to make one attack miss (short-rest reaction). Illusory
 * Reality lets you name an illusory object you've made briefly real. Improved
 * Minor Illusion and Malleable Illusions ride along as reminders.
 */
export default function IllusionBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;

  const selfUsed = !!cf.illusorySelf;
  const reality = cf.illusoryReality || { active: false, label: '' };

  const setSelf = (used) => onUpdate({ classFeature: { ...cf, illusorySelf: used } });
  const setReality = (next) => onUpdate({ classFeature: { ...cf, illusoryReality: { ...reality, ...next } } });

  const hasSelf = level >= 10;
  const hasReality = level >= 14;
  const hasMalleable = level >= 6;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-rogue)' }}>
      {/* Illusory Self — the decoy */}
      {hasSelf && (
        <div className={`dnd-mirror ${selfUsed ? 'dnd-mirror--spent' : ''}`}>
          <div className="dnd-mirror__figures">
            <Copy size={26} className="dnd-mirror__ghost" />
          </div>
          <div className="dnd-mirror__body">
            <h4 className="dnd-mirror__title">Illusory Self</h4>
            <span className="dnd-warmagic__note">
              {selfUsed
                ? 'Decoy spent — returns on a short or long rest.'
                : 'Reaction: a duplicate takes the hit — the attack automatically misses you.'}
            </span>
          </div>
          <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => setSelf(!selfUsed)}>
            {selfUsed ? 'Reset' : 'Interpose'}
          </button>
        </div>
      )}

      {/* Illusory Reality — made-real object */}
      {hasReality && (
        <div className={`dnd-warmagic__section ${reality.active ? 'dnd-real--on' : ''}`}>
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Box size={13} /> Illusory Reality</h4>
            <span className="dnd-warmagic__uses">{reality.active ? 'real · 1 min' : 'idle'}</span>
          </div>
          {reality.active ? (
            <div className="dnd-warmagic__row">
              <input className="dnd-real__input" placeholder="object made real…" value={reality.label}
                onChange={(e) => setReality({ label: e.target.value })} />
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => setReality({ active: false })}>End</button>
            </div>
          ) : (
            <div className="dnd-warmagic__row">
              <span className="dnd-warmagic__note">Bonus action: make one inanimate object in your illusion real for 1 minute (can't harm anyone).</span>
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => setReality({ active: true })}>Make Real</button>
            </div>
          )}
        </div>
      )}

      {/* Reminders */}
      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <Sparkles size={12} />
          <span><strong>Improved Minor Illusion</strong> — you know Minor Illusion (free), and one casting makes both a sound <em>and</em> an image.</span>
        </div>
        {hasMalleable && (
          <div className="dnd-warmagic__reminder">
            <Shuffle size={12} />
            <span><strong>Malleable Illusions</strong> — action: reshape an illusion spell (1 min+ duration) you can see, within its normal parameters.</span>
          </div>
        )}
      </div>
    </div>
  );
}
