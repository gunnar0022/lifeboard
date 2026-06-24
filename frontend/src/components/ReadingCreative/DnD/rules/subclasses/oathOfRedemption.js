/**
 * Oath of Redemption — the peaceful paladin who shields others with their own
 * body. Flavor on the Features tab; the Combat-tab RedemptionBlock surfaces the
 * two Channel Divinity options plus the damage-absorbing aura, self-healing, and
 * the avatar-of-peace capstone (all reminders — no per-rest pools beyond CD).
 */
export default {
  name: 'Oath of Redemption',
  className: 'Paladin',
  features: [
    {
      id: 'red-tenets', name: 'Tenets of Redemption', level: 3,
      source: 'Oath of Redemption', noTruncate: true,
      desc: 'Hold to a high standard of peace and justice. • Peace: violence is a last resort; diplomacy and understanding bring lasting peace. • Innocence: all begin innocent — set the proper example to guide anyone to a righteous path. • Patience: change takes time; work day after day to let righteousness flourish. • Wisdom: keep heart and mind clear, for some are so far gone that ending them is the only just choice.',
    },
    {
      id: 'red-spells', name: 'Oath of Redemption Spells', level: 3,
      source: 'Oath of Redemption',
      desc: "Always-prepared oath spells (they don't count against your prepared spells): 3rd Sanctuary, Sleep · 5th Calm Emotions, Hold Person · 9th Counterspell, Hypnotic Pattern · 13th Otiluke's Resilient Sphere, Stoneskin · 17th Hold Monster, Wall of Force. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'red-cd', name: 'Channel Divinity', level: 3,
      source: 'Oath of Redemption', noTruncate: true,
      desc: 'Two options (spend a Channel Divinity use; see the Combat tab). • Emissary of Peace: bonus action — gain a +5 bonus to Charisma (Persuasion) checks for 10 min. • Rebuke the Violent: reaction right after an attacker within 30 ft. damages a creature other than you — the attacker makes a WIS save, taking radiant damage equal to the damage it dealt (half on a success).',
    },
    {
      id: 'red-aura', name: 'Aura of the Guardian', level: 7,
      source: 'Oath of Redemption', combat: true,
      desc: "When a creature within 10 ft. of you takes damage, you can use your reaction to magically take that damage instead (it can't be reduced in any way; other effects aren't transferred). The aura increases to 30 ft. at 18th level.",
    },
    {
      id: 'red-protective', name: 'Protective Spirit', level: 15,
      source: 'Oath of Redemption', combat: true,
      desc: "You regain 1d6 + half your paladin level HP if you end your turn in combat with fewer than half your hit points remaining and you aren't incapacitated.",
    },
    {
      id: 'red-emissary', name: 'Emissary of Redemption', level: 20,
      source: 'Oath of Redemption', combat: true,
      desc: 'You become an avatar of peace: you have resistance to all damage dealt by other creatures, and whenever a creature hits you with an attack it takes radiant damage equal to half the damage you take. If you attack a creature, cast a spell on it, or otherwise damage it, neither benefit works against that creature until you finish a long rest.',
    },
  ],
};
