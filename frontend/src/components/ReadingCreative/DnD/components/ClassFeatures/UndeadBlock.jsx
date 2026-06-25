import { Skull, Bone, HeartCrack, Wind } from 'lucide-react';
import { proficiencyBonus } from '../../dndUtils';
import FormActivationPanel from './FormActivationPanel';
import { OnceToggle } from './trackers';

/**
 * The Undead — Combat tab. Form of Dread is the engine: a PB-use transform (long
 * rest) that grants rolled 1d10 + level temp HP and unlocks the frighten-on-hit /
 * necrotic upgrades. Grave Touched is a passive reminder, Necrotic Husk is a
 * death-defying reaction (1d4-long-rest, manual reset), and Spirit Projection is
 * a once-per-long-rest out-of-body action. State lives in classFeature.
 */
const DREAD_COLOR = 'var(--dnd-class-warlock)';

export default function UndeadBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const pb = proficiencyBonus(level);

  const used = cf.formDreadUses || 0;
  const remaining = Math.max(0, pb - used);
  const active = !!cf.formDreadActive;
  const inForm = active;

  const patch = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });

  const activateForm = () => {
    if (remaining <= 0 || active) return;
    const tempHp = level + 1 + Math.floor(Math.random() * 10);   // 1d10 + level
    patch({ formDreadActive: true, formDreadUses: used + 1, _grantTempHp: tempHp });
  };
  const endForm = () => patch({ formDreadActive: false });

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': DREAD_COLOR }}>
      <FormActivationPanel
        color={DREAD_COLOR}
        icon={<Skull size={15} />}
        title="Form of Dread"
        idleLabel={`TRANSFORM · ${remaining}/${pb} USES`}
        endLabel="END FORM OF DREAD"
        activeLabel="FORM OF DREAD"
        active={active}
        canActivate={remaining > 0 && !active}
        disabledReason="No uses left — long rest"
        onActivate={activateForm}
        onEnd={endForm}
      >
        <p className="dnd-form-panel__effect-line">Gained <strong>1d10 + {level}</strong> temp HP.</p>
        <p className="dnd-form-panel__effect-line">Once per turn on a hit: target makes a WIS save or is <strong>frightened</strong> until end of your next turn.</p>
        <p className="dnd-form-panel__effect-line">Immune to the frightened condition.</p>
        {level >= 6 && <p className="dnd-form-panel__effect-line">Grave Touched: necrotic damage rolls <strong>one extra die</strong>.</p>}
        {level >= 10 && <p className="dnd-form-panel__effect-line"><strong>Immune</strong> to necrotic damage (Necrotic Husk).</p>}
      </FormActivationPanel>

      <div className="dnd-warmagic__reminders">
        {level >= 6 && (
          <div className={`dnd-warmagic__reminder ${inForm ? 'dnd-warmagic__reminder--active' : ''}`}>
            <Bone size={12} />
            <span><strong>Grave Touched</strong> — no need to eat, drink, or breathe. Once per turn, replace your damage with necrotic{inForm ? ' (+1 die while transformed)' : ''}.</span>
          </div>
        )}
        {level >= 10 && (
          <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
            <HeartCrack size={12} />
            <span><strong>Necrotic Husk</strong> — resistance to necrotic damage{inForm ? ' (immune while transformed)' : ''}.</span>
          </div>
        )}
      </div>

      {/* Necrotic Husk reaction — death-defying eruption */}
      {level >= 10 && (
        <OnceToggle
          icon={<HeartCrack size={13} />} title="Husk Eruption" rest="1d4 long rests"
          used={!!cf.necroticHuskUsed}
          note={<>Reaction at 0 HP: drop to 1 HP instead and erupt — each chosen creature within 30 ft takes <strong>2d10 + {level}</strong> necrotic. You gain 1 level of exhaustion. Reset manually after 1d4 long rests.</>}
          onToggle={() => patch({ necroticHuskUsed: !cf.necroticHuskUsed })}
        />
      )}

      {/* Spirit Projection */}
      {level >= 14 && (
        <OnceToggle
          icon={<Wind size={13} />} title="Spirit Projection" rest="long rest"
          used={!!cf.spiritProjectionUsed}
          note="Action: project your spirit for up to 1 hour (concentration). Resistance to B/P/S; conjuration & necromancy need no V/S/M; fly = walk speed and move through objects. In Form of Dread, regain HP equal to half the necrotic damage you deal (once per turn)."
          onToggle={() => patch({ spiritProjectionUsed: !cf.spiritProjectionUsed })}
        />
      )}
    </div>
  );
}
