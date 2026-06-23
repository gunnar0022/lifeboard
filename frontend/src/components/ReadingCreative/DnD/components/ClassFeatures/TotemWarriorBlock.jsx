import { proficiencyBonus, abilityMod } from '../../dndUtils';

/**
 * Path of the Totem Warrior — Combat-tab tracker. The combat-relevant power comes
 * from two independent totem choices (Spirit at 3rd, Totemic Attunement at 14th),
 * each pickable from Bear/Eagle/Elk/Tiger/Wolf. This block holds those selections
 * and shows the active benefit, rage-aware. (Aspect of the Beast at 6th is a
 * non-combat utility pick and lives on the Features tab.) No per-rest pools.
 */
const ANIMALS = ['Bear', 'Eagle', 'Elk', 'Tiger', 'Wolf'];

const SPIRIT = {
  Bear: 'Resistance to all damage except psychic while raging.',
  Eagle: 'Not in heavy armor: enemies have disadvantage on opportunity attacks vs. you, and you can Dash as a bonus action.',
  Elk: 'Not in heavy armor: walking speed +15 ft while raging.',
  Tiger: 'While raging, +10 ft long jump and +3 ft high jump.',
  Wolf: 'While raging, allies have advantage on melee attacks vs. hostiles within 5 ft of you.',
};

const ATTUNEMENT = {
  Bear: () => 'Hostiles within 5 ft have disadvantage attacking anyone but you (unless they can\'t see/hear you or can\'t be frightened).',
  Eagle: () => 'Flying speed equal to your walking speed while raging (you fall if you end your turn aloft).',
  Elk: (dc) => `Bonus action to pass through a Large or smaller creature's space: STR save DC ${dc} or it's knocked prone and takes 1d12 + STR bludgeoning.`,
  Tiger: () => 'Move 20+ ft straight at a Large or smaller target before a melee attack → bonus-action extra melee attack.',
  Wolf: () => 'Bonus action to knock a Large or smaller creature prone when you hit it with a melee attack.',
};

function TotemPicker({ tierLabel, lvl, selected, onSelect, accent }) {
  return (
    <div className="dnd-totem__tier">
      <div className="dnd-totem__header">
        <h4 className="dnd-totem__subtitle">{tierLabel}</h4>
        <span className="dnd-totem__lvl">Lvl {lvl}</span>
      </div>
      <div className="dnd-totem__animals">
        {ANIMALS.map(a => (
          <button
            key={a}
            className={`dnd-totem__animal ${selected === a ? `dnd-totem__animal--active dnd-totem__animal--${accent}` : ''}`}
            onClick={() => onSelect(a)}
          >{a}</button>
        ))}
      </div>
    </div>
  );
}

export default function TotemWarriorBlock({ character, onUpdate }) {
  const cf = character.classFeature || {};
  const level = character.meta?.level || 3;
  const abilities = character.abilities || {};
  const strMod = abilityMod(abilities.STR || 10);
  const elkDC = 8 + strMod + proficiencyBonus(level);
  const isRaging = cf.active || false;

  const spirit = cf.totemSpirit || null;
  const attunement = cf.totemAttunement || null;

  const set = (key, animal) => onUpdate({ classFeature: { ...cf, [key]: cf[key] === animal ? null : animal } });

  return (
    <div className="dnd-totem">
      {!isRaging && <p className="dnd-totem__inactive-note">Most totem benefits apply only while raging.</p>}

      <TotemPicker tierLabel="Totem Spirit" lvl={3} selected={spirit} accent="spirit"
        onSelect={a => set('totemSpirit', a)} />
      {spirit && <p className="dnd-totem__benefit">{SPIRIT[spirit]}</p>}

      {level >= 14 && (
        <>
          <TotemPicker tierLabel="Totemic Attunement" lvl={14} selected={attunement} accent="attune"
            onSelect={a => set('totemAttunement', a)} />
          {attunement && <p className="dnd-totem__benefit">{ATTUNEMENT[attunement](elkDC)}</p>}
        </>
      )}
    </div>
  );
}
