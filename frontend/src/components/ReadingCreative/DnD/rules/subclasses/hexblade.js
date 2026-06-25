/**
 * The Hexblade — Warlock. A pact with a sentient weapon of shadow, turning the
 * warlock into a Charisma-driven martial striker. The centerpiece is the
 * Hexblade's Curse (a target-marking buff) and the Hex Warrior CHA-weapon link;
 * Accursed Specter binds a slain soul to fight for you. All on the HexbladeBlock.
 */
export default {
  name: 'The Hexblade',
  className: 'Warlock',
  features: [
    {
      id: 'hex-spells', name: 'Hexblade Expanded Spells', level: 1,
      source: 'The Hexblade',
      desc: 'These spells are added to the warlock spell list for you: 1st Shield, Wrathful Smite · 2nd Blur, Branding Smite · 3rd Blink, Elemental Weapon · 4th Phantasmal Killer, Staggering Smite · 5th Banishing Smite, Cone of Cold. Learn them as warlock spells on the Spells tab.',
    },
    {
      id: 'hex-curse', name: "Hexblade's Curse", level: 1,
      source: 'The Hexblade', combat: true,
      desc: 'Bonus action: curse a creature you can see within 30 ft for 1 minute (ends early if it or you dies, or you are incapacitated). Until it ends: add your proficiency bonus to damage rolls against the target, score a critical hit against it on a 19–20, and when it dies regain HP equal to your warlock level + your Charisma modifier (min 1). Once per short or long rest. Mark the target on the Combat tab.',
    },
    {
      id: 'hex-warrior', name: 'Hex Warrior', level: 1,
      source: 'The Hexblade', combat: true,
      desc: 'You gain proficiency with medium armor, shields, and martial weapons. On a long rest, touch one weapon you are proficient with that lacks the two-handed property; you can use your Charisma modifier instead of Strength or Dexterity for its attack and damage rolls until your next long rest. With Pact of the Blade, this extends to every pact weapon you conjure.',
    },
    {
      id: 'hex-specter', name: 'Accursed Specter', level: 6,
      source: 'The Hexblade', combat: true,
      desc: 'When you slay a humanoid, you can cause its spirit to rise as a specter under your command. It gains temporary hit points equal to half your warlock level and a bonus to attack rolls equal to your Charisma modifier (min +0), rolls its own initiative, and serves until the end of your next long rest. Once per long rest. Summon and track the specter on the Combat tab.',
    },
    {
      id: 'hex-armor', name: 'Armor of Hexes', level: 10,
      source: 'The Hexblade', combat: true,
      desc: "If the target of your Hexblade's Curse hits you with an attack, you can use your reaction to roll a d6; on a 4 or higher, the attack misses you regardless of its roll.",
    },
    {
      id: 'hex-master', name: 'Master of Hexes', level: 14,
      source: 'The Hexblade', combat: true,
      desc: "When the creature cursed by your Hexblade's Curse dies, you can apply the curse to a different creature you can see within 30 ft (provided you aren't incapacitated). You don't regain HP from the previous creature's death when you spread the curse this way.",
    },
  ],
};
