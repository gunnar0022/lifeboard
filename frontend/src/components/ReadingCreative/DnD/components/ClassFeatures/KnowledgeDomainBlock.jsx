import { BookOpen, Brain, Wand2, Library } from 'lucide-react';
import { abilityMod } from '../../dndUtils';
import ChannelDivinityPanel from './ChannelDivinityPanel';

/**
 * Knowledge Domain — Combat tab. Two Channel Divinity options (Knowledge of the
 * Ages, then Read Thoughts at 6th) draw from the shared cleric charges; the
 * once-per-rest Visions of the Past is a simple ready/spent toggle. Blessings of
 * Knowledge / Potent Spellcasting ride as reminders, in the cleric healer style.
 */
const ACCENT = 'var(--dnd-class-cleric)';

export default function KnowledgeDomainBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const wisMod = abilityMod(character.abilities?.WIS || 10);

  const options = [{
    name: 'Knowledge of the Ages',
    icon: <BookOpen size={13} />,
    desc: 'Action: gain proficiency with one skill or tool of your choice for 10 minutes.',
  }];
  if (level >= 6) {
    options.push({
      name: 'Read Thoughts',
      icon: <Brain size={13} />,
      desc: "Action: a creature within 60 ft makes a WIS save; on a failure you read its surface thoughts for 1 min and can end it to cast Suggestion (no slot, auto-fail).",
    });
  }

  const visionsUsed = !!cf.visionsUsed;

  return (
    <div className="dnd-warmagic dnd-cleric" style={{ '--block-accent': ACCENT }}>
      <ChannelDivinityPanel character={character} onUpdate={onUpdate} options={options} source="cleric" />

      {level >= 17 && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Library size={13} /> Visions of the Past</h4>
            <span className={`dnd-warmagic__uses ${visionsUsed ? 'dnd-cleric__used' : ''}`}>{visionsUsed ? 'spent' : 'ready'}</span>
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Meditate (concentration, up to WIS-score minutes) for Object or Area Reading. Once per short or long rest.</span>
            <div className="dnd-warmagic__btns">
              <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => onUpdate({ classFeature: { ...cf, visionsUsed: !visionsUsed } })}>
                {visionsUsed ? 'Reset' : 'Use'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <BookOpen size={12} />
          <span><strong>Blessings of Knowledge</strong> — two languages and two skills (Arcana/History/Nature/Religion) with doubled proficiency bonus.</span>
        </div>
        {level >= 8 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <Wand2 size={12} />
            <span><strong>Potent Spellcasting</strong> — add your WIS modifier (+{Math.max(0, wisMod)}) to the damage of any cleric cantrip.</span>
          </div>
        )}
      </div>
    </div>
  );
}
