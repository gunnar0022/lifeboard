import { useEffect, useRef } from 'react';
import { Sun, Flame, Wand2, Sparkles } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import ChannelDivinityPanel from './ChannelDivinityPanel';

/**
 * Light Domain — Combat tab. Channel Divinity: Radiance of the Dawn (AoE radiant
 * = 2d10 + level) headlines, drawing from the shared cleric charges; the
 * WIS-scaled Warding Flare reaction pool is tracked below, with Improved Flare /
 * Potent Spellcasting / Corona of Light as reminders.
 */
const ACCENT = 'var(--dnd-class-cleric)';

export default function LightDomainBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const wisMod = abilityMod(character.abilities?.WIS || 10);
  const flareMax = Math.max(1, wisMod);
  const prev = useRef(null);

  useEffect(() => {
    const p = prev.current;
    prev.current = flareMax;
    if (cf.wardingFlare?.max !== flareMax) {
      const stored = cf.wardingFlare?.current;
      const next = stored == null ? flareMax
        : (p != null && flareMax > p ? Math.min(stored + (flareMax - p), flareMax) : Math.min(stored, flareMax));
      onUpdate({ classFeature: { ...cf, wardingFlare: { max: flareMax, current: next } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flareMax]);

  const flare = cf.wardingFlare || { current: flareMax, max: flareMax };
  const stepFlare = (d) =>
    onUpdate({ classFeature: { ...cf, wardingFlare: { ...flare, current: Math.max(0, Math.min(flare.max, flare.current + d)) } } });

  const options = [{
    name: 'Radiance of the Dawn',
    icon: <Sun size={13} />,
    desc: <>Action: dispel magical darkness within 30 ft; each hostile creature within 30 ft (without total cover) makes a CON save for <strong>2d10 + {level}</strong> radiant (half on success).</>,
  }];

  return (
    <div className="dnd-warmagic dnd-cleric" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} source="cleric" />

      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Flame size={13} /> Warding Flare</h4>
          <span className="dnd-warmagic__uses">{flare.current}/{flare.max}</span>
        </div>
        <div className="dnd-warmagic__pips">
          {Array.from({ length: flare.max }, (_, i) => (
            <span key={i} className={`dnd-warmagic__pip ${i < flare.current ? 'dnd-warmagic__pip--full' : ''}`} />
          ))}
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">
            Reaction: impose disadvantage on an attacker within 30 ft you can see{level >= 6 ? ' (or one attacking an ally — Improved Flare)' : ''}. Long rest.
          </span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn" onClick={() => stepFlare(1)} disabled={flare.current >= flare.max}>+</button>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => stepFlare(-1)} disabled={flare.current <= 0}>Use</button>
          </div>
        </div>
      </div>

      <div className="dnd-warmagic__reminders">
        {level >= 8 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Wand2 size={12} />
            <span><strong>Potent Spellcasting</strong> — add your WIS modifier (+{Math.max(0, wisMod)}) to the damage of any cleric cantrip.</span>
          </div>
        )}
        {level >= 17 && (
          <div className="dnd-warmagic__reminder">
            <Sparkles size={12} />
            <span><strong>Corona of Light</strong> — action: 60-ft bright light for 1 min; enemies in it have disadvantage on saves vs. fire/radiant spells.</span>
          </div>
        )}
      </div>
    </div>
  );
}
