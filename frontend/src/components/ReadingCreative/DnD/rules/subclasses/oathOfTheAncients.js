/**
 * Oath of the Ancients — Paladin subclass. Flavor-heavy (tenets, oath spells)
 * with a light combat footprint. The Features tab carries the lore; the Combat-
 * tab AncientsBlock focuses on the two Channel Divinity options and the
 * trackable survival/transform abilities (Undying Sentinel, Elder Champion).
 */
export default {
  name: 'Oath of the Ancients',
  className: 'Paladin',
  features: [
    {
      id: 'anc-tenets', name: 'Tenets of the Ancients', level: 3,
      source: 'Oath of the Ancients', noTruncate: true,
      desc: 'Good above law or chaos — kindle hope. • Kindle the Light: through mercy, kindness, and forgiveness, beat back despair. • Shelter the Light: stand against the wickedness that would swallow good, beauty, love, and laughter. • Preserve Your Own Light: delight in song, laughter, beauty, and art. • Be the Light: a beacon of joy and courage in all your deeds.',
    },
    {
      id: 'anc-spells', name: 'Oath of the Ancients Spells', level: 3,
      source: 'Oath of the Ancients',
      desc: 'Always-prepared oath spells (they don\'t count against your prepared spells): 3rd Ensnaring Strike, Speak with Animals · 5th Moonbeam, Misty Step · 9th Plant Growth, Protection from Energy · 13th Ice Storm, Stoneskin · 17th Commune with Nature, Tree Stride. Pin them as Always Prepared on the Spells tab.',
    },
    {
      id: 'anc-cd', name: 'Channel Divinity', level: 3,
      source: 'Oath of the Ancients', noTruncate: true,
      desc: "Two options (spend a Channel Divinity use; see the Combat tab). • Nature's Wrath: action — spectral vines reach for a creature within 10 ft.; it makes a STR or DEX save (its choice) or is restrained, repeating the save at the end of each of its turns. • Turn the Faithless: action — present your holy symbol; each fey or fiend within 30 ft. that can hear you makes a WIS save or is turned for 1 minute (or until it takes damage). Turned creatures flee and have their true form revealed.",
    },
    {
      id: 'anc-aura', name: 'Aura of Warding', level: 7,
      source: 'Oath of the Ancients', combat: true,
      desc: 'You and friendly creatures within 10 ft. of you have resistance to damage from spells. The aura increases to 30 ft. at 18th level.',
    },
    {
      id: 'anc-undying', name: 'Undying Sentinel', level: 15,
      source: 'Oath of the Ancients', combat: true,
      desc: "When you are reduced to 0 HP and not killed outright, you can drop to 1 HP instead. Once per long rest. You also suffer no drawbacks of old age and can't be aged magically.",
    },
    {
      id: 'anc-elder', name: 'Elder Champion', level: 20,
      source: 'Oath of the Ancients', combat: true,
      desc: 'Action: for 1 minute, regain 10 HP at the start of each of your turns; cast paladin spells with a 1-action casting time as a bonus action; and enemies within 10 ft. have disadvantage on saves against your paladin spells and Channel Divinity. Once per long rest.',
    },
  ],
};
