/**
 * Oath of the Watchers — sentinel against extraplanar threats. Flavor on the
 * Features tab; the Combat-tab WatchersBlock surfaces the two Channel Divinity
 * options, the initiative aura, the at-will Vigilant Rebuke (with live damage),
 * and the trackable Mortal Bulwark capstone.
 */
export default {
  name: 'Oath of the Watchers',
  className: 'Paladin',
  features: [
    {
      id: 'wat-tenets', name: 'Tenets of the Watchers', level: 3,
      source: 'Oath of the Watchers', noTruncate: true,
      desc: 'Safeguard the mortal realms from otherworldly threats. • Vigilance: the threats you face are cunning and subversive — be ever alert for their corruption. • Loyalty: never accept gifts or favors from fiends; stay true to your order, comrades, and duty. • Discipline: you are the shield against the terrors beyond the stars — keep your blade sharp and your mind keen.',
    },
    {
      id: 'wat-spells', name: 'Oath of the Watchers Spells', level: 3,
      source: 'Oath of the Watchers',
      desc: "Always-prepared oath spells (they don't count against your prepared spells): 3rd Alarm, Detect Magic · 5th Moonbeam, See Invisibility · 9th Counterspell, Nondetection · 13th Aura of Purity, Banishment · 17th Hold Monster, Scrying. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'wat-cd', name: 'Channel Divinity', level: 3,
      source: 'Oath of the Watchers', noTruncate: true,
      desc: "Two options (spend a Channel Divinity use; see the Combat tab). • Watcher's Will: action — choose up to your CHA modifier of creatures within 30 ft.; for 1 min, you and they have advantage on INT, WIS, and CHA saves. • Abjure the Extraplanar: action — each aberration, celestial, elemental, fey, or fiend within 30 ft. that can hear you makes a WIS save or is turned for 1 min (or until it takes damage).",
    },
    {
      id: 'wat-aura', name: 'Aura of the Sentinel', level: 7,
      source: 'Oath of the Watchers', combat: true,
      desc: "While you aren't incapacitated, when you and chosen creatures within 10 ft. roll initiative, you all gain a bonus to initiative equal to your proficiency bonus. The aura increases to 30 ft. at 18th level.",
    },
    {
      id: 'wat-rebuke', name: 'Vigilant Rebuke', level: 15,
      source: 'Oath of the Watchers', combat: true,
      desc: 'Whenever you or a creature you can see within 30 ft. succeeds on an INT, WIS, or CHA saving throw, you can use your reaction to deal 2d8 + your CHA modifier force damage to the creature that forced the save.',
    },
    {
      id: 'wat-bulwark', name: 'Mortal Bulwark', level: 20,
      source: 'Oath of the Watchers', combat: true,
      desc: 'Bonus action: for 1 minute, gain truesight 120 ft.; advantage on attacks against aberrations, celestials, elementals, fey, and fiends; and when you hit a creature, you can force a CHA save vs. your spell save DC or banish it to its native plane. Once per long rest, or expend a 5th-level spell slot to use it again.',
    },
  ],
};
