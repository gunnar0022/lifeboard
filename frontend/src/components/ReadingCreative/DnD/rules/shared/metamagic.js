/** Sorcerer Metamagic options + known count. */
export const METAMAGIC_OPTIONS = [
  { name: 'Careful Spell', cost: '1 SP', desc: 'Protect up to your CHA modifier creatures from a save-based spell (they auto-succeed).' },
  { name: 'Distant Spell', cost: '1 SP', desc: 'Double a spell\'s range (5 ft+), or make a touch spell reach 30 ft.' },
  { name: 'Empowered Spell', cost: '1 SP', desc: 'Reroll up to your CHA modifier damage dice. Stacks with one other Metamagic.' },
  { name: 'Extended Spell', cost: '1 SP', desc: 'Double a spell\'s duration (1 min+), to a max of 24 hours.' },
  { name: 'Heightened Spell', cost: '3 SP', desc: 'One target has disadvantage on its first save against the spell.' },
  { name: 'Quickened Spell', cost: '2 SP', desc: 'Change a 1-action casting time to a bonus action.' },
  { name: 'Seeking Spell', cost: '2 SP', desc: 'Reroll a missed spell attack roll; use the new roll.' },
  { name: 'Subtle Spell', cost: '1 SP', desc: 'Cast without somatic or verbal components.' },
  { name: 'Transmuted Spell', cost: '1 SP', desc: 'Change a spell\'s damage type among acid, cold, fire, lightning, poison, thunder.' },
  { name: 'Twinned Spell', cost: 'spell level SP', desc: 'Target a second creature with a single-target, non-self spell (1 SP for a cantrip).' },
];

/** Metamagic options known by sorcerer level. */
export function metamagicKnown(level) {
  if (level >= 17) return 4;
  if (level >= 10) return 3;
  if (level >= 3) return 2;
  return 0;
}
