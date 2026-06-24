/**
 * Oath of Devotion — the archetypal holy knight. Flavor on the Features tab;
 * the Combat-tab DevotionBlock surfaces the two Channel Divinity options plus
 * the anti-charm aura and the trackable Holy Nimbus capstone.
 */
export default {
  name: 'Oath of Devotion',
  className: 'Paladin',
  features: [
    {
      id: 'dev-tenets', name: 'Tenets of Devotion', level: 3,
      source: 'Oath of Devotion', noTruncate: true,
      desc: 'The ideal of the knight in shining armor. • Honesty: don\'t lie or cheat — let your word be your promise. • Courage: never fear to act, though caution is wise. • Compassion: aid others, protect the weak, show mercy tempered with wisdom. • Honor: treat others fairly and be an example. • Duty: be responsible for your actions and protect those in your care.',
    },
    {
      id: 'dev-spells', name: 'Oath of Devotion Spells', level: 3,
      source: 'Oath of Devotion',
      desc: "Always-prepared oath spells (they don't count against your prepared spells): 3rd Protection from Evil and Good, Sanctuary · 5th Lesser Restoration, Zone of Truth · 9th Beacon of Hope, Dispel Magic · 13th Freedom of Movement, Guardian of Faith · 17th Commune, Flame Strike. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'dev-cd', name: 'Channel Divinity', level: 3,
      source: 'Oath of Devotion', noTruncate: true,
      desc: 'Two options (spend a Channel Divinity use; see the Combat tab). • Sacred Weapon: action — for 1 min, add your CHA modifier (min +1) to attacks with one held weapon; it sheds bright light (20 ft.) and becomes magical. • Turn the Unholy: action — each fiend or undead within 30 ft. that can see/hear you makes a WIS save or is turned for 1 min (or until it takes damage).',
    },
    {
      id: 'dev-aura', name: 'Aura of Devotion', level: 7,
      source: 'Oath of Devotion', combat: true,
      desc: "While you're conscious, you and friendly creatures within 10 ft. of you can't be charmed. The aura increases to 30 ft. at 18th level.",
    },
    {
      id: 'dev-purity', name: 'Purity of Spirit', level: 15,
      source: 'Oath of Devotion', combat: true,
      desc: 'You are always under the effects of a Protection from Evil and Good spell.',
    },
    {
      id: 'dev-nimbus', name: 'Holy Nimbus', level: 20,
      source: 'Oath of Devotion', combat: true,
      desc: 'Action: for 1 minute, you emanate bright sunlight in a 30-ft. radius (dim 30 ft. beyond). An enemy that starts its turn in the bright light takes 10 radiant damage, and you have advantage on saves against spells cast by fiends or undead. Once per long rest.',
    },
  ],
};
