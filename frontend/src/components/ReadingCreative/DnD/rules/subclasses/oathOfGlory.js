/**
 * Oath of Glory — the heroic athlete of legend. Flavor on the Features tab; the
 * Combat-tab GloryBlock surfaces the two Channel Divinity options, the speed
 * aura, and the trackable Glorious Defense (CHA / long) and Living Legend.
 */
export default {
  name: 'Oath of Glory',
  className: 'Paladin',
  features: [
    {
      id: 'glory-tenets', name: 'Tenets of Glory', level: 3,
      source: 'Oath of Glory', noTruncate: true,
      desc: 'Strive for heroics worthy of legend. • Actions over Words: be known by glorious deeds, not words. • Challenges Are but Tests: face hardship with courage, and rally your allies to face it with you. • Hone the Body: work your body so its potential is realized. • Discipline the Soul: master the discipline to overcome your own failings.',
    },
    {
      id: 'glory-spells', name: 'Oath of Glory Spells', level: 3,
      source: 'Oath of Glory',
      desc: "Always-prepared oath spells (they don't count against your prepared spells): 3rd Guiding Bolt, Heroism · 5th Enhance Ability, Magic Weapon · 9th Haste, Protection from Energy · 13th Compulsion, Freedom of Movement · 17th Commune, Flame Strike. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'glory-cd', name: 'Channel Divinity', level: 3,
      source: 'Oath of Glory', noTruncate: true,
      desc: 'Two options (spend a Channel Divinity use; see the Combat tab). • Peerless Athlete: bonus action — for 10 min, advantage on Athletics & Acrobatics, double carrying capacity, and +10 ft. to your jumps. • Inspiring Smite: bonus action right after a Divine Smite — distribute 2d8 + your paladin level temp HP among creatures within 30 ft.',
    },
    {
      id: 'glory-alacrity', name: 'Aura of Alacrity', level: 7,
      source: 'Oath of Glory', combat: true,
      desc: "Your walking speed increases by 10 ft. While you aren't incapacitated, any ally who starts their turn within 5 ft. of you (10 ft. at 18th level) gains +10 ft. walking speed until the end of that turn.",
    },
    {
      id: 'glory-defense', name: 'Glorious Defense', level: 15,
      source: 'Oath of Glory', combat: true,
      desc: 'When you or a creature you can see within 10 ft. is hit by an attack, you can use your reaction to add your CHA modifier (min +1) to the target\'s AC against that attack — possibly causing it to miss. If it misses, you can make one weapon attack against the attacker if it\'s in range. Uses equal to your CHA modifier (min 1); regain all on a long rest.',
    },
    {
      id: 'glory-legend', name: 'Living Legend', level: 20,
      source: 'Oath of Glory', combat: true,
      desc: 'Bonus action: for 1 minute, gain advantage on all Charisma checks; once per turn you can turn a missed weapon attack into a hit; and you can use your reaction to reroll a failed saving throw (using the new roll). Once per long rest, or expend a 5th-level spell slot to use it again.',
    },
  ],
};
