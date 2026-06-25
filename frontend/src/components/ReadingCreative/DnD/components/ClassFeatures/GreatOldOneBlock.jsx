import { Brain, Eye, ShieldAlert, Users } from 'lucide-react';
import { OnceToggle } from './trackers';

/**
 * The Great Old One — Combat tab. Mostly mind magic: Awakened Mind and Thought
 * Shield are passive reminders, Entropic Ward is a once-per-rest reaction, and
 * Create Thrall is a persistent dominated-thrall slot (a named target that lasts
 * until dispelled, so it has no rest reset). State lives in classFeature.
 */
const ACCENT = 'var(--dnd-class-warlock)';

export default function GreatOldOneBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const patch = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <Brain size={12} />
          <span><strong>Awakened Mind</strong> — telepathically speak to any creature within 30 ft that understands a language.</span>
        </div>
        {level >= 10 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <ShieldAlert size={12} />
            <span><strong>Thought Shield</strong> — resistance to psychic damage; a creature that deals psychic damage to you takes the same amount. Your thoughts can't be read.</span>
          </div>
        )}
      </div>

      {/* Entropic Ward — reaction */}
      {level >= 6 && (
        <OnceToggle
          icon={<Eye size={13} />} title="Entropic Ward" rest="short or long rest"
          used={!!cf.entropicWardUsed}
          note="Reaction: impose disadvantage on an attack roll against you. If it misses, your next attack against that creature (by end of your next turn) has advantage."
          onToggle={() => patch({ entropicWardUsed: !cf.entropicWardUsed })}
        />
      )}

      {/* Create Thrall — persistent domination */}
      {level >= 14 && (
        <div className={`dnd-sig ${cf.thrallName ? 'dnd-sig--locked' : 'dnd-sig--empty'}`} style={{ '--block-accent': ACCENT }}>
          <div className="dnd-sig__token"><Users size={20} /></div>
          <div className="dnd-sig__body">
            <span className="dnd-sig__title"><Users size={13} /> Create Thrall</span>
            <div className="dnd-sig__target-row">
              <input className="dnd-field dnd-field--sm dnd-sig__target" value={cf.thrallName || ''} placeholder="Charmed thrall…"
                onChange={e => patch({ thrallName: e.target.value })} />
              {cf.thrallName && <button className="dnd-sig__clear" title="Release thrall" onClick={() => patch({ thrallName: '' })}>✕</button>}
            </div>
            <span className="dnd-sig__desc">Action: touch an incapacitated humanoid to charm it until Remove Curse, the condition is removed, or you create another thrall. Telepathic link on the same plane.</span>
          </div>
        </div>
      )}
    </div>
  );
}
