import { abilityMod, proficiencyBonus } from '../../dndUtils';

const CIRCLE_SPELLS = [
  { level: 3, spells: 'Blindness/Deafness, Gentle Repose' },
  { level: 5, spells: 'Animate Dead, Gaseous Form' },
  { level: 7, spells: 'Blight, Confusion' },
  { level: 9, spells: 'Cloudkill, Contagion' },
];

function haloDamageDie(level) {
  if (level >= 14) return 'd10';
  if (level >= 10) return 'd8';
  if (level >= 6) return 'd6';
  return 'd4';
}

export default function CircleOfSporesBlock({ character, editMode, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 2;
  const wis = character.abilities?.WIS || 10;
  const profBonus = proficiencyBonus(level);
  const wisMod = abilityMod(wis);
  const sporeDC = 8 + wisMod + profBonus;

  // Fungal Infestation (6th level) uses = WIS mod
  const fungalMax = Math.max(1, wisMod);
  const fungalUsed = cf.fungalInfestationUsed || 0;

  // Spreading Spores active state (10th level)
  const spreadingActive = cf.spreadingSporesActive || false;

  const isSymbiotic = cf.activeForm === 'spores' && cf.active;
  const haloDie = haloDamageDie(level);

  const useFungalInfestation = () => {
    if (fungalUsed >= fungalMax) return;
    onUpdate({ classFeature: { ...cf, fungalInfestationUsed: fungalUsed + 1 } });
  };

  const toggleSpreading = () => {
    onUpdate({ classFeature: { ...cf, spreadingSporesActive: !spreadingActive } });
  };

  return (
    <div className="dnd-spores">
      {/* Circle Spells */}
      <div className="dnd-spores__section">
        <h4 className="dnd-spores__subtitle">Circle Spells</h4>
        <p className="dnd-spores__desc-sm">Know Chill Touch cantrip. Always prepared (don't count against limit):</p>
        <div className="dnd-spores__spell-table">
          {CIRCLE_SPELLS.filter(s => level >= s.level).map(s => (
            <div key={s.level} className="dnd-spores__spell-row">
              <span className="dnd-spores__spell-level">Lvl {s.level}</span>
              <span className="dnd-spores__spell-names">{s.spells}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Halo of Spores */}
      <div className="dnd-spores__section">
        <h4 className="dnd-spores__subtitle">Halo of Spores</h4>
        <p className="dnd-spores__desc">
          Reaction: creature moves within 10ft or starts turn there → 1{haloDie} necrotic (CON save DC {sporeDC} negates).
          {isSymbiotic && <strong> Symbiotic Entity: roll damage dice twice.</strong>}
        </p>
        {spreadingActive && level >= 10 && (
          <p className="dnd-spores__spreading-note">
            Spreading Spores active — Halo reaction unavailable. Spores in 10ft cube within 30ft.
          </p>
        )}
      </div>

      {/* Symbiotic Entity Reference */}
      <div className="dnd-spores__section">
        <h4 className="dnd-spores__subtitle">Symbiotic Entity</h4>
        <p className="dnd-spores__desc-sm">
          Expend Wild Shape. Gain {4 * level} temp HP (4 × level). While active:
        </p>
        <ul className="dnd-spores__effect-list">
          <li>Halo of Spores damage dice doubled</li>
          <li>+1d6 necrotic on melee weapon attacks</li>
        </ul>
        <p className="dnd-spores__desc-sm">Lasts 10 min, or until temp HP depleted.</p>
        {isSymbiotic && (
          <div className="dnd-spores__active-badge">SYMBIOTIC ENTITY ACTIVE</div>
        )}
      </div>

      {/* Fungal Infestation (6th level) */}
      {level >= 6 && (
        <div className="dnd-spores__section">
          <h4 className="dnd-spores__subtitle">Fungal Infestation</h4>
          <p className="dnd-spores__desc-sm">
            Reaction: when a Small/Medium beast or humanoid dies within 10ft, animate it (1 HP zombie, 1 hour).
          </p>
          <div className="dnd-spores__resource-row">
            <span>Uses: {fungalMax - fungalUsed}/{fungalMax} (WIS mod)</span>
            <button
              className="dnd-spores__use-btn"
              onClick={useFungalInfestation}
              disabled={fungalUsed >= fungalMax}
            >
              Animate
            </button>
          </div>
        </div>
      )}

      {/* Spreading Spores (10th level) */}
      {level >= 10 && (
        <div className="dnd-spores__section">
          <h4 className="dnd-spores__subtitle">Spreading Spores</h4>
          <p className="dnd-spores__desc-sm">
            Bonus action (while Symbiotic Entity active): hurl spores 30ft into 10ft cube, 1 min.
            Creatures entering/starting turn take Halo damage. Replaces Halo reaction.
          </p>
          {isSymbiotic && (
            <button
              className={`dnd-spores__toggle ${spreadingActive ? 'dnd-spores__toggle--active' : ''}`}
              onClick={toggleSpreading}
            >
              {spreadingActive ? 'END SPREADING' : 'SPREAD SPORES'}
            </button>
          )}
        </div>
      )}

      {/* Fungal Body (14th level) */}
      {level >= 14 && (
        <div className="dnd-spores__section">
          <h4 className="dnd-spores__subtitle">Fungal Body</h4>
          <p className="dnd-spores__desc">
            Immune to: Blinded, Deafened, Frightened, Poisoned. Critical hits against you count as normal hits (unless incapacitated).
          </p>
        </div>
      )}
    </div>
  );
}
