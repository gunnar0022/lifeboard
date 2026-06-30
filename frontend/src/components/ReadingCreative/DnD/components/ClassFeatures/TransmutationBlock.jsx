import { Gem, Moon, Wind, Shield, Flame, Sparkles, FlaskConical } from 'lucide-react';

const BENEFITS = [
  { key: 'darkvision', label: 'Darkvision 60 ft', icon: Moon },
  { key: 'speed', label: '+10 ft speed', icon: Wind },
  { key: 'conSave', label: 'CON save prof.', icon: Shield },
  { key: 'resistance', label: 'Damage resist.', icon: Flame },
];
const RESIST = ['acid', 'cold', 'fire', 'lightning', 'thunder'];
const MASTER = [
  { key: 'major', label: 'Major Transformation', note: 'Transmute an object ≤5-ft cube (10 min handling).' },
  { key: 'panacea', label: 'Panacea', note: 'End all curses, diseases & poisons; restore all HP.' },
  { key: 'life', label: 'Restore Life', note: 'Cast Raise Dead without a slot.' },
  { key: 'youth', label: 'Restore Youth', note: 'Reduce apparent age by 3d10 years (min 13).' },
];

/**
 * School of Transmutation — Combat tab. The Transmuter's Stone is the centerpiece:
 * forge it, then swap its stored boon on the fly (free whenever you cast a
 * transmutation spell). At 14th, shatter it for one of four miracles. Shapechanger
 * tracks your free Polymorph; Minor Alchemy rides along as a reminder.
 */
export default function TransmutationBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;

  const stone = cf.transmutersStone || { created: false, benefit: 'darkvision', resistType: 'fire', consumed: false };
  const shapeUsed = !!cf.shapechangerUsed;

  const setStone = (next) => onUpdate({ classFeature: { ...cf, transmutersStone: { ...stone, ...next } } });
  const forge = () => setStone({ created: true, consumed: false });
  const shatter = (effect) => setStone({ created: false, consumed: true, lastEffect: effect });

  const hasStone = level >= 6;
  const hasShape = level >= 10;
  const hasMaster = level >= 14;
  const ResistName = stone.resistType;

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-cleric)' }}>
      {/* Transmuter's Stone */}
      {hasStone && (
        <div className={`dnd-stone ${stone.created ? 'dnd-stone--lit' : ''}`}>
          <div className="dnd-stone__head">
            <div className="dnd-stone__gem"><Gem size={20} /></div>
            <div>
              <h4 className="dnd-stone__title">Transmuter's Stone</h4>
              <span className="dnd-warmagic__note">
                {stone.created
                  ? 'Swap the boon free whenever you cast a transmutation spell (1st+).'
                  : stone.consumed
                    ? `Shattered (${MASTER.find(m => m.key === stone.lastEffect)?.label || 'consumed'}) — reforge after a long rest.`
                    : 'Spend 8 hours to forge a stone storing one boon.'}
              </span>
            </div>
            {!stone.created && <button className="dnd-warmagic__btn dnd-warmagic__btn--spend dnd-stone__forge" onClick={forge}>Forge</button>}
          </div>

          {stone.created && (
            <>
              <div className="dnd-stone__opts">
                {BENEFITS.map(({ key, label, icon: Icon }) => (
                  <button key={key} className={`dnd-stone__opt ${stone.benefit === key ? 'dnd-stone__opt--sel' : ''}`}
                    onClick={() => setStone({ benefit: key })}>
                    <Icon size={12} /> {label}
                  </button>
                ))}
              </div>
              {stone.benefit === 'resistance' && (
                <div className="dnd-stone__resist">
                  {RESIST.map(r => (
                    <button key={r} className={`dnd-stone__rchip ${ResistName === r ? 'dnd-stone__rchip--sel' : ''}`}
                      onClick={() => setStone({ resistType: r })}>{r}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Master Transmuter — shatter for a miracle */}
      {hasMaster && stone.created && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Sparkles size={13} /> Master Transmuter</h4>
          </div>
          <span className="dnd-warmagic__note">Action: consume &amp; destroy the stone for one effect (reforge after a long rest):</span>
          <div className="dnd-master__opts">
            {MASTER.map(({ key, label, note }) => (
              <button key={key} className="dnd-master__opt" onClick={() => shatter(key)} title={note}>{label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Shapechanger */}
      {hasShape && (
        <div className="dnd-warmagic__section">
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><FlaskConical size={13} /> Shapechanger</h4>
            <span className="dnd-warmagic__uses">{shapeUsed ? 'spent' : 'ready'}</span>
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">Free Polymorph on yourself into a beast (CR ≤ 1). 1 / short or long rest (slots still work normally).</span>
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend"
              onClick={() => onUpdate({ classFeature: { ...cf, shapechangerUsed: !shapeUsed } })}>
              {shapeUsed ? 'Reset' : 'Transform'}
            </button>
          </div>
        </div>
      )}

      {/* Reminders */}
      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder">
          <FlaskConical size={12} />
          <span><strong>Minor Alchemy</strong> — transform wood, stone, iron, copper, or silver into another of those (1 cu. ft / 10 min; reverts after 1 hr or lost concentration).</span>
        </div>
      </div>
    </div>
  );
}
