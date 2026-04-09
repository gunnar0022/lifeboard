import { abilityMod, proficiencyBonus } from '../../dndUtils';

const FEATURES = [
  {
    name: 'Bonus Proficiencies',
    unlockLevel: 3,
    desc: 'Proficiency with the disguise kit and the poisoner\'s kit.',
  },
  {
    name: 'Assassinate',
    unlockLevel: 3,
    desc: 'Advantage on attack rolls against any creature that hasn\'t taken a turn in combat yet. Any hit against a surprised creature is a critical hit.',
  },
  {
    name: 'Infiltration Expertise',
    unlockLevel: 9,
    desc: 'You can create false identities. Spend 7 days and 25 gp to establish the history, profession, and affiliations for an identity. You can\'t establish an identity that belongs to someone else.',
  },
  {
    name: 'Impostor',
    unlockLevel: 13,
    desc: 'You can unerringly mimic another person\'s speech, writing, and behavior after studying them for 3+ hours. If a creature suspects something, you have advantage on Charisma (Deception) checks to avoid detection.',
  },
  {
    name: 'Death Strike',
    unlockLevel: 17,
    desc: null, // Computed dynamically with DC
  },
];

export default function AssassinBlock({ character }) {
  const level = character.meta?.level || 3;
  const dex = character.abilities?.DEX || 10;
  const profBonus = proficiencyBonus(level);
  const deathStrikeDC = 8 + abilityMod(dex) + profBonus;

  const visibleFeatures = FEATURES.filter(f => f.unlockLevel <= level);

  if (visibleFeatures.length === 0) return null;

  return (
    <div className="dnd-assassin">
      {visibleFeatures.map(feat => (
        <div key={feat.name} className="dnd-assassin__feature">
          <div className="dnd-assassin__feature-header">
            <span className="dnd-assassin__feature-name">{feat.name}</span>
            <span className="dnd-assassin__feature-level">Lvl {feat.unlockLevel}</span>
          </div>
          <p className="dnd-assassin__feature-desc">
            {feat.name === 'Death Strike'
              ? `When you hit a surprised creature, it must make a CON save (DC ${deathStrikeDC}) or take double damage from the attack.`
              : feat.desc}
          </p>
          {feat.name === 'Assassinate' && (
            <div className="dnd-assassin__reminder">
              Remember: This stacks with Sneak Attack — a surprised target takes a critical Sneak Attack.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
