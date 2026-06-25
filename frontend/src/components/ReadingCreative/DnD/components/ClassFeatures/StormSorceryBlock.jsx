import { Wind, Zap, CloudLightning, CloudRain, Feather } from 'lucide-react';
import { abilityMod, proficiencyBonus } from '../../dndUtils';
import { OnceToggle } from './trackers';

/**
 * Storm Sorcery — Combat tab. A passive-heavy origin, so the focus is on live
 * values: Heart of the Storm's eruption damage and Storm's Fury's reaction
 * (level damage + push, with a live save DC) headline as reminders, with the
 * Wind Soul flight-share as a once-per-rest grant. State lives in classFeature.
 */
const ACCENT = 'var(--dnd-class-sorcerer)';

export default function StormSorceryBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const pb = proficiencyBonus(level);
  const chaMod = abilityMod(character.abilities?.CHA || 10);
  const saveDC = 8 + pb + chaMod;
  const erupt = Math.floor(level / 2);
  const flightShare = Math.max(1, 3 + chaMod);

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Feather size={12} />
          <span><strong>Tempestuous Magic</strong> — bonus action just before/after casting a leveled spell: fly up to 10 ft without provoking opportunity attacks.</span>
        </div>

        {level >= 6 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <CloudLightning size={12} />
            <span><strong>Heart of the Storm</strong> — resistance to lightning &amp; thunder. When you start a leveled lightning/thunder spell, creatures within 10 ft take <strong>{erupt}</strong> lightning or thunder (your choice).</span>
          </div>
        )}
        {level >= 6 && (
          <div className="dnd-warmagic__reminder">
            <CloudRain size={12} />
            <span><strong>Storm Guide</strong> — stop the rain in a 20-ft sphere (action), or set the wind's direction in a 100-ft sphere each round (bonus action).</span>
          </div>
        )}
        {level >= 14 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Zap size={12} />
            <span><strong>Storm's Fury</strong> — reaction when hit by a melee attack: deal <strong>{level}</strong> lightning to the attacker; it makes a <strong>STR save DC {saveDC}</strong> or is pushed up to 20 ft.</span>
          </div>
        )}
      </div>

      {/* Wind Soul — flight share */}
      {level >= 18 && (
        <OnceToggle
          icon={<Wind size={13} />} title="Wind Soul" rest="short or long rest"
          used={!!cf.windSoulUsed}
          note={<>Immunity to lightning &amp; thunder; magical flying speed 60 ft. Action: drop to fly 30 ft for 1 hr and grant fly 30 ft to <strong>{flightShare}</strong> creatures (3 + CHA) within 30 ft.</>}
          onToggle={() => onUpdate({ classFeature: { ...cf, windSoulUsed: !cf.windSoulUsed } })}
        />
      )}
    </div>
  );
}
