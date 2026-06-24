import { Orbit, Compass, Sparkles, Swords, ShieldHalf } from 'lucide-react';
import { OnceToggle } from './trackers';

/**
 * Horizon Walker — Combat tab. Planar Warrior headlines as a signature panel
 * showing the scaling force-damage die (1d8 → 2d8) and an optional marked
 * target. The two short-rest abilities (Detect Portal, Ethereal Step) use the
 * shared OnceToggle; Distant Strike and the at-will Spectral Defense reaction
 * ride as reminders.
 */
const ACCENT = 'var(--dnd-class-ranger)';

export default function HorizonWalkerBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const planarDie = level >= 11 ? '2d8' : '1d8';
  const target = cf.planarTarget || '';

  const patchCf = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      <div className="dnd-sig dnd-sig--planar">
        <div className="dnd-sig__token">{planarDie}</div>
        <div className="dnd-sig__body">
          <span className="dnd-sig__title"><Orbit size={13} /> Planar Warrior</span>
          <span className="dnd-sig__desc">
            Bonus action: mark a creature within 30 ft. Your next hit on it this turn becomes <strong>force</strong> damage and deals an extra <strong>{planarDie} force</strong>.
          </span>
          <input className="dnd-field dnd-field--sm dnd-sig__target" value={target} placeholder="Marked target…"
            onChange={e => patchCf({ planarTarget: e.target.value })} />
        </div>
      </div>

      <OnceToggle icon={<Compass size={13} />} title="Detect Portal" used={cf.detectPortalUsed || false}
        note="Action: sense the nearest planar portal within 1 mile."
        onToggle={() => patchCf({ detectPortalUsed: !cf.detectPortalUsed })} />

      {level >= 7 && (
        <OnceToggle icon={<Sparkles size={13} />} title="Ethereal Step" used={cf.etherealStepUsed || false}
          note="Bonus action: cast Etherealness free, but it ends at the end of this turn."
          onToggle={() => patchCf({ etherealStepUsed: !cf.etherealStepUsed })} />
      )}

      <div className="dnd-warmagic__reminders">
        {level >= 11 && (
          <div className="dnd-warmagic__reminder">
            <Swords size={12} />
            <span><strong>Distant Strike</strong> — on the Attack action, teleport up to 10 ft. before each attack; attack 2+ creatures to gain one extra attack against a third.</span>
          </div>
        )}
        {level >= 15 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <ShieldHalf size={12} />
            <span><strong>Spectral Defense</strong> — reaction: when an attack damages you, gain resistance to all of that attack's damage this turn.</span>
          </div>
        )}
      </div>
    </div>
  );
}
