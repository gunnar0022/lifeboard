import { Sparkles, Wind, Eye, Shield } from 'lucide-react';

/**
 * The Archfey — Combat tab tracker. Fey Presence, Misty Escape, and Dark
 * Delirium are each once per short/long rest, tracked as simple used toggles.
 * Beguiling Defenses is a passive reminder. State lives in classFeature.
 */
export default function ArchfeyBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;

  const toggle = (key) => onUpdate({ classFeature: { ...cf, [key]: !cf[key] } });

  const ability = (key, label, icon, available, note) => (
    <div className={`dnd-warmagic__section ${available ? '' : 'dnd-archfey__spent'}`}>
      <div className="dnd-warmagic__head">
        <h4 className="dnd-warmagic__subtitle">{icon} {label}</h4>
        <button
          className={`dnd-warmagic__btn ${available ? 'dnd-warmagic__btn--spend' : ''}`}
          onClick={() => toggle(key)}
        >
          {available ? 'Use' : 'Restore'}
        </button>
      </div>
      <p className="dnd-warmagic__note">{note}</p>
    </div>
  );

  return (
    <div className="dnd-warmagic">
      {ability('feyPresenceUsed', 'Fey Presence', <Sparkles size={13} />, !cf.feyPresenceUsed,
        '10-ft cube: WIS save or charmed/frightened until end of your next turn. 1 / short or long rest.')}

      {level >= 6 && ability('mistyEscapeUsed', 'Misty Escape', <Wind size={13} />, !cf.mistyEscapeUsed,
        'Reaction on taking damage: turn invisible and teleport 60 ft. 1 / short or long rest.')}

      {level >= 14 && ability('darkDeliriumUsed', 'Dark Delirium', <Eye size={13} />, !cf.darkDeliriumUsed,
        'Action: creature within 60 ft, WIS save or charmed/frightened 1 min (as concentration). 1 / short or long rest.')}

      {level >= 10 && (
        <div className="dnd-warmagic__reminder">
          <Shield size={12} />
          <span><strong>Beguiling Defenses</strong> — immune to being charmed; reaction to turn a charm attempt back on the caster (WIS save).</span>
        </div>
      )}
    </div>
  );
}
