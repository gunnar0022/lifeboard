/**
 * Light Domain — Cleric. Radiant blaster and protector. Channel Divinity:
 * Radiance of the Dawn (an AoE radiant nuke = 2d10 + level) headlines the
 * cleric-styled LightDomainBlock, with the WIS-scaled Warding Flare reaction
 * pool tracked below and Potent Spellcasting / Corona of Light as reminders.
 */
export default {
  name: 'Light Domain',
  className: 'Cleric',
  features: [
    {
      id: 'light-spells', name: 'Light Domain Spells', level: 1,
      source: 'Light Domain',
      desc: "Always-prepared domain spells (they don't count against your prepared spells): 1st Burning Hands, Faerie Fire · 3rd Flaming Sphere, Scorching Ray · 5th Daylight, Fireball · 7th Guardian of Faith, Wall of Fire · 9th Flame Strike, Scrying. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'light-cantrip', name: 'Bonus Cantrip', level: 1,
      source: 'Light Domain',
      desc: "You gain the Light cantrip if you don't already know it; it doesn't count against your cleric cantrips known.",
    },
    {
      id: 'light-flare', name: 'Warding Flare', level: 1,
      source: 'Light Domain', combat: true,
      desc: 'Reaction: when a creature within 30 ft you can see attacks you, impose disadvantage on the attack roll (no effect on creatures that can\'t be blinded). Uses equal to your WIS modifier (min once), regained on a long rest. Track uses on the Combat tab.',
    },
    {
      id: 'light-radiance', name: 'Channel Divinity: Radiance of the Dawn', level: 2,
      source: 'Light Domain', combat: true,
      desc: 'Action: spend a Channel Divinity use to dispel magical darkness within 30 ft and force each hostile creature within 30 ft (without total cover) to make a CON save, taking 2d10 + your cleric level radiant damage (half on success). Spend the use on the Combat tab.',
    },
    {
      id: 'light-improved-flare', name: 'Improved Flare', level: 6,
      source: 'Light Domain', combat: true,
      desc: 'You can also use Warding Flare when a creature within 30 ft you can see attacks a creature other than you.',
    },
    {
      id: 'light-potent', name: 'Potent Spellcasting', level: 8,
      source: 'Light Domain', combat: true,
      desc: 'You add your Wisdom modifier to the damage you deal with any cleric cantrip.',
    },
    {
      id: 'light-corona', name: 'Corona of Light', level: 17,
      source: 'Light Domain', combat: true,
      desc: 'Action: for 1 minute (or until you dismiss it), emit bright light in a 60-ft radius and dim light 30 ft beyond. Enemies in the bright light have disadvantage on saves against spells that deal fire or radiant damage.',
    },
  ],
};
