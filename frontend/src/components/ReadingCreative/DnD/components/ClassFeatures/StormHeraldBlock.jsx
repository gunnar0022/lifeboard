import { proficiencyBonus, abilityMod } from '../../dndUtils';

/**
 * Path of the Storm Herald — Combat-tab tracker. Everything keys off the chosen
 * environment (Desert / Sea / Tundra), so this block is an environment selector
 * that drives the live Storm Aura value, the Storm Soul / Shielding Storm passive,
 * and the Raging Storm reaction — all scaled to level and rage-aware. No per-rest
 * pools (Storm Aura is a bonus action, Raging Storm a reaction, both at-will).
 */
const ENVIRONMENTS = ['desert', 'sea', 'tundra'];

function desertAura(level) {
  if (level >= 20) return 6;
  if (level >= 15) return 5;
  if (level >= 10) return 4;
  if (level >= 5) return 3;
  return 2;
}
function seaAura(level) {
  if (level >= 20) return '4d6';
  if (level >= 15) return '3d6';
  if (level >= 10) return '2d6';
  return '1d6';
}
const tundraAura = desertAura; // same 2/3/4/5/6 progression

const AURA = {
  desert: (lvl) => ({ label: 'Fire damage to all others in aura', value: `${desertAura(lvl)} fire`, accent: 'desert' }),
  sea: (lvl) => ({ label: 'One creature: DEX save or take', value: `${seaAura(lvl)} lightning`, accent: 'sea' }),
  tundra: (lvl) => ({ label: 'Temp HP to chosen creatures in aura', value: `${tundraAura(lvl)} temp HP`, accent: 'tundra' }),
};
const SOUL = {
  desert: 'Resist fire, ignore extreme heat; touch to ignite unattended flammables.',
  sea: 'Resist lightning, breathe underwater, swim speed 30 ft.',
  tundra: 'Resist cold, ignore extreme cold; freeze a 5-ft cube of water for 1 min.',
};
const RAGING = {
  desert: (lvl) => `Reaction when a creature in your aura hits you: DEX save or ${Math.floor(lvl / 2)} fire damage.`,
  sea: () => 'Reaction when you hit a creature in your aura: STR save or knocked prone.',
  tundra: () => 'When your aura activates: one creature makes a STR save or its speed drops to 0 until your next turn.',
};
const RESIST_WORD = { desert: 'fire', sea: 'lightning', tundra: 'cold' };

export default function StormHeraldBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const abilities = character.abilities || {};
  const conMod = abilityMod(abilities.CON || 10);
  const dc = 8 + proficiencyBonus(level) + conMod;
  const isRaging = cf.active || false;
  const env = cf.stormEnvironment || 'desert';

  const setEnv = (e) => onUpdate({ classFeature: { ...cf, stormEnvironment: e } });
  const aura = AURA[env](level);

  return (
    <div className={`dnd-storm dnd-storm--${env}`}>
      <div className="dnd-storm__env-tabs">
        {ENVIRONMENTS.map(e => (
          <button
            key={e}
            className={`dnd-storm__env-tab dnd-storm__env-tab--${e} ${env === e ? 'dnd-storm__env-tab--active' : ''}`}
            onClick={() => setEnv(e)}
          >{e}</button>
        ))}
      </div>

      {/* Storm Aura (3rd) */}
      <div className="dnd-storm__section">
        <div className="dnd-storm__header">
          <h4 className="dnd-storm__subtitle">Storm Aura — 10 ft</h4>
          <span className="dnd-storm__dc">DC {dc}</span>
        </div>
        <div className="dnd-storm__aura">
          <span className="dnd-storm__aura-label">{aura.label}</span>
          <span className="dnd-storm__aura-value">{aura.value}</span>
        </div>
        {isRaging ? (
          <div className="dnd-storm__active-note">RAGING — activate again as a bonus action each turn</div>
        ) : (
          <p className="dnd-storm__inactive-note">Activate Rage to emanate your aura</p>
        )}
      </div>

      {/* Storm Soul (6th) + Shielding Storm (10th) */}
      {level >= 6 && (
        <div className="dnd-storm__section">
          <div className="dnd-storm__header">
            <h4 className="dnd-storm__subtitle">Storm Soul</h4>
            <span className="dnd-storm__lvl">Lvl 6</span>
          </div>
          <p className="dnd-storm__note">{SOUL[env]}</p>
          {level >= 10 && (
            <p className="dnd-storm__note dnd-storm__note--shield">
              <strong>Shielding Storm:</strong> chosen creatures in your aura also gain your {RESIST_WORD[env]} resistance.
            </p>
          )}
        </div>
      )}

      {/* Raging Storm (14th) */}
      {level >= 14 && (
        <div className="dnd-storm__section">
          <div className="dnd-storm__header">
            <h4 className="dnd-storm__subtitle">Raging Storm</h4>
            <span className="dnd-storm__lvl">Lvl 14</span>
          </div>
          <p className="dnd-storm__note">{RAGING[env](level)}</p>
        </div>
      )}
    </div>
  );
}
