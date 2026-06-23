import { Leaf, BookOpen, Shield, Sparkles } from 'lucide-react';
import { proficiencyBonus, abilityMod } from '../../dndUtils';

/**
 * Circle of the Land — Combat tab. Pick your land and the block lights up the circle
 * spells you always have prepared, unlocking each row as you reach 3rd/5th/7th/9th.
 * Natural Recovery is a once-per-long-rest slot refund (shown with its level budget),
 * and Nature's Sanctuary's save DC is computed live. Accent: druid green.
 */
const LAND_SPELLS = {
  arctic:    { 3: 'Hold Person, Spike Growth', 5: 'Sleet Storm, Slow', 7: 'Freedom of Movement, Ice Storm', 9: 'Commune with Nature, Cone of Cold' },
  coast:     { 3: 'Mirror Image, Misty Step', 5: 'Water Breathing, Water Walk', 7: 'Control Water, Freedom of Movement', 9: 'Conjure Elemental, Scrying' },
  desert:    { 3: 'Blur, Silence', 5: 'Create Food and Water, Protection from Energy', 7: 'Blight, Hallucinatory Terrain', 9: 'Insect Plague, Wall of Stone' },
  forest:    { 3: 'Barkskin, Spider Climb', 5: 'Call Lightning, Plant Growth', 7: 'Divination, Freedom of Movement', 9: 'Commune with Nature, Tree Stride' },
  grassland: { 3: 'Invisibility, Pass Without Trace', 5: 'Daylight, Haste', 7: 'Divination, Freedom of Movement', 9: 'Dream, Insect Plague' },
  mountain:  { 3: 'Spider Climb, Spike Growth', 5: 'Lightning Bolt, Meld into Stone', 7: 'Stone Shape, Stoneskin', 9: 'Passwall, Wall of Stone' },
  swamp:     { 3: "Darkness, Melf's Acid Arrow", 5: 'Water Walk, Stinking Cloud', 7: 'Freedom of Movement, Locate Creature', 9: 'Insect Plague, Scrying' },
  underdark: { 3: 'Spider Climb, Web', 5: 'Gaseous Form, Stinking Cloud', 7: 'Greater Invisibility, Stone Shape', 9: 'Cloudkill, Insect Plague' },
};
const LANDS = Object.keys(LAND_SPELLS);

export default function LandBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;
  const wisMod = abilityMod(character.abilities?.WIS || 10);
  const saveDC = 8 + proficiencyBonus(level) + wisMod;
  const recoverLevels = Math.ceil(level / 2);
  const land = cf.druidLand || null;
  const recoveryUsed = cf.naturalRecoveryUsed || false;

  const setLand = (l) => onUpdate({ classFeature: { ...cf, druidLand: cf.druidLand === l ? null : l } });

  return (
    <div className="dnd-warmagic" style={{ '--block-accent': 'var(--dnd-class-druid)' }}>
      {/* Circle Spells — land picker + reference */}
      <div className="dnd-warmagic__section">
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Leaf size={13} /> Circle Spells</h4>
        </div>
        <div className="dnd-druid__lands">
          {LANDS.map(l => (
            <button key={l} className={`dnd-druid__land ${land === l ? 'dnd-druid__land--active' : ''}`} onClick={() => setLand(l)}>{l}</button>
          ))}
        </div>
        {land ? (
          <div className="dnd-druid__circle-spells">
            {[3, 5, 7, 9].map(lvl => (
              <div key={lvl} className={`dnd-druid__circle-row ${level >= lvl ? '' : 'dnd-druid__circle-row--locked'}`}>
                <span className="dnd-druid__circle-lvl">L{lvl}</span>
                <span className="dnd-druid__circle-names">{LAND_SPELLS[land][lvl]}</span>
              </div>
            ))}
            <p className="dnd-warmagic__note">Always prepared; they don't count against your prepared spells.</p>
          </div>
        ) : (
          <p className="dnd-warmagic__note">Choose the land where you became a druid to see its always-prepared spells.</p>
        )}
      </div>

      {/* Natural Recovery */}
      <div className={`dnd-warmagic__section ${recoveryUsed ? 'dnd-archfey__spent' : ''}`}>
        <div className="dnd-warmagic__head">
          <h4 className="dnd-warmagic__subtitle"><Sparkles size={13} /> Natural Recovery</h4>
          <span className="dnd-warmagic__uses">{recoveryUsed ? 'spent' : '1 / long'}</span>
        </div>
        <div className="dnd-warmagic__row">
          <span className="dnd-warmagic__note">Short rest: recover slots totalling <strong>{recoverLevels}</strong> level{recoverLevels === 1 ? '' : 's'} (none 6th+).</span>
          <div className="dnd-warmagic__btns">
            <button className="dnd-warmagic__btn dnd-warmagic__btn--spend" onClick={() => onUpdate({ classFeature: { ...cf, naturalRecoveryUsed: !recoveryUsed } })}>{recoveryUsed ? 'Reset' : 'Use'}</button>
          </div>
        </div>
      </div>

      <div className="dnd-warmagic__reminders">
        {level >= 6 && (
          <div className="dnd-warmagic__reminder">
            <BookOpen size={12} />
            <span><strong>Land's Stride</strong> — nonmagical difficult terrain &amp; plants don't slow or harm you; advantage vs. movement-impeding plants.</span>
          </div>
        )}
        {level >= 10 && (
          <div className="dnd-warmagic__reminder">
            <Shield size={12} />
            <span><strong>Nature's Ward</strong> — immune to poison &amp; disease; can't be charmed or frightened by elementals or fey.</span>
          </div>
        )}
        {level >= 14 && (
          <div className="dnd-warmagic__reminder">
            <Leaf size={12} />
            <span><strong>Nature's Sanctuary</strong> — a beast/plant attacking you makes a <strong>WIS save DC {saveDC}</strong> or must retarget (or miss).</span>
          </div>
        )}
      </div>
    </div>
  );
}
