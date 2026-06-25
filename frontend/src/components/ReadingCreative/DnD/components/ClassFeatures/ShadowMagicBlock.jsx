import { Eye, Skull, Dog, Footprints, Moon } from 'lucide-react';
import { OnceToggle } from './trackers';

/**
 * Shadow Magic — Combat tab. The Hound of Ill Omen is the signature: a 3-SP
 * dire-wolf summon shown as a stat-bearing card. Strength of the Grave is a
 * once-per-long-rest death save, Eyes of the Dark spends 2 SP for Darkness, and
 * Umbral Form is a 6-SP shadow transform. Sorcery points live on the base
 * Sorcerer card above. State lives in classFeature.
 */
const ACCENT = 'var(--dnd-class-sorcerer)';

export default function ShadowMagicBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 1;
  const sp = cf.currentPoints ?? 0;
  const houndTemp = Math.floor(level / 2);
  const houndActive = !!cf.houndActive;
  const umbral = !!cf.umbralForm;

  const patch = (fields) => onUpdate({ classFeature: { ...cf, ...fields } });
  const spend = (n, fields = {}) => { if (sp >= n) patch({ currentPoints: sp - n, ...fields }); };

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': ACCENT }}>
      {/* Eyes of the Dark */}
      <div className="dnd-warmagic__reminders">
        <div className="dnd-warmagic__reminder dnd-warmagic__reminder--active">
          <Eye size={12} />
          <span><strong>Eyes of the Dark</strong> — darkvision 120 ft.{level >= 3 ? ' Cast Darkness with a slot or 2 SP (see through your own).' : ''}</span>
          {level >= 3 && (
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend dnd-warmagic__inline-btn" onClick={() => spend(2)} disabled={sp < 2}>−2 SP</button>
          )}
        </div>
      </div>

      {/* Strength of the Grave */}
      <OnceToggle
        icon={<Skull size={13} />} title="Strength of the Grave" rest="long rest"
        used={!!cf.strengthGraveUsed}
        note={<>At 0 HP (not from radiant or a crit): make a <strong>CHA save (DC 5 + damage)</strong>; on a success, drop to 1 HP instead.</>}
        onToggle={() => patch({ strengthGraveUsed: !cf.strengthGraveUsed })}
      />

      {/* Hound of Ill Omen */}
      {level >= 6 && (
        <div className={`dnd-sig ${houndActive ? 'dnd-sig--locked' : 'dnd-sig--empty'}`} style={{ '--block-accent': ACCENT }}>
          <div className="dnd-sig__token"><Dog size={20} /></div>
          <div className="dnd-sig__body">
            <div className="dnd-sig__title">
              <Dog size={13} /> Hound of Ill Omen
              <span className="dnd-warmagic__uses" style={{ marginLeft: 'auto' }}>{houndActive ? 'on the hunt' : '3 SP'}</span>
            </div>
            <div className="dnd-companion__topline">
              <div className="dnd-companion__stat"><span className="dnd-companion__stat-lbl">AC</span><span className="dnd-companion__stat-val">14</span></div>
              <div className="dnd-companion__stat"><span className="dnd-companion__stat-lbl">HP</span><span className="dnd-companion__stat-val">37</span></div>
              <div className="dnd-companion__stat"><span className="dnd-companion__stat-lbl">Temp</span><span className="dnd-companion__stat-val">+{houndTemp}</span></div>
              <div className="dnd-companion__stat dnd-companion__stat--wide"><span className="dnd-companion__stat-lbl">Speed</span><span className="dnd-companion__stat-val dnd-companion__stat-val--text">50 ft (phases)</span></div>
            </div>
            <div className="dnd-companion__action" style={{ borderLeftColor: ACCENT }}>
              <div className="dnd-companion__action-head">
                <span className="dnd-companion__action-name">Bite</span>
                <span className="dnd-companion__hit">+5 to hit</span>
              </div>
              <p className="dnd-companion__damage">2d6 + 3 piercing · STR save DC 13 or knocked prone</p>
            </div>
            <span className="dnd-sig__desc">Hunts one target (within 120 ft): always knows its location; while within 5 ft the target has disadvantage on saves vs. your spells. Lasts 5 min.</span>
            <div className="dnd-warmagic__btns">
              {houndActive
                ? <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => patch({ houndActive: false })}>Dismiss</button>
                : <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => spend(3, { houndActive: true })} disabled={sp < 3}>Summon −3 SP</button>}
            </div>
          </div>
        </div>
      )}

      {/* Shadow Walk */}
      {level >= 14 && (
        <div className="dnd-warmagic__reminders">
          <div className="dnd-warmagic__reminder">
            <Footprints size={12} />
            <span><strong>Shadow Walk</strong> — in dim light or darkness, bonus action: teleport up to 120 ft to another shadowed space you can see.</span>
          </div>
        </div>
      )}

      {/* Umbral Form */}
      {level >= 18 && (
        <div className={`dnd-warmagic__section ${umbral ? 'dnd-warmagic__reminder--active' : ''}`}>
          <div className="dnd-warmagic__head">
            <h4 className="dnd-warmagic__subtitle"><Moon size={13} /> Umbral Form</h4>
            <span className="dnd-warmagic__uses">{umbral ? 'shadow form' : '6 SP'}</span>
          </div>
          <div className="dnd-warmagic__row">
            <span className="dnd-warmagic__note">1 min: resistance to all damage except force &amp; radiant; move through creatures/objects (5 force if you end inside one).</span>
            <div className="dnd-warmagic__btns">
              {umbral
                ? <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => patch({ umbralForm: false })}>Dismiss</button>
                : <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => spend(6, { umbralForm: true })} disabled={sp < 6}>Transform −6 SP</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
