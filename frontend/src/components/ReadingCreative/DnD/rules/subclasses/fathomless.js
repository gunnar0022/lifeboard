/**
 * The Fathomless — Warlock. A pact with a leviathan of the deep. The signature
 * is the Tentacle of the Deeps — a summonable spectral tentacle that strikes and
 * defends — tracked on the FathomlessBlock alongside the free Evard's cast of
 * Grasping Tentacles and the rest-limited Fathomless Plunge teleport.
 */
export default {
  name: 'The Fathomless',
  className: 'Warlock',
  features: [
    {
      id: 'fath-spells', name: 'Fathomless Expanded Spells', level: 1,
      source: 'The Fathomless',
      desc: "These spells are added to the warlock spell list for you: 1st Create or Destroy Water, Thunderwave · 2nd Gust of Wind, Silence · 3rd Lightning Bolt, Sleet Storm · 4th Control Water, Summon Elemental (water only) · 5th Bigby's Hand (a tentacle), Cone of Cold. Learn them as warlock spells on the Spells tab.",
    },
    {
      id: 'fath-tentacle', name: 'Tentacle of the Deeps', level: 1,
      source: 'The Fathomless', combat: true,
      desc: 'Bonus action: summon a 10-ft spectral tentacle within 60 ft for 1 minute (or until you summon another). On creation you can make a melee spell attack against a creature within 10 ft of it: on a hit, 1d8 cold damage (2d8 at 10th level) and its speed is reduced by 10 ft until the start of your next turn. As a bonus action you can move the tentacle up to 30 ft and repeat the attack. Uses equal to your proficiency bonus, regained on a long rest. Summon and track it on the Combat tab.',
    },
    {
      id: 'fath-gift', name: 'Gift of the Sea', level: 1,
      source: 'The Fathomless',
      desc: 'You gain a swimming speed of 40 feet, and you can breathe underwater.',
    },
    {
      id: 'fath-oceanic', name: 'Oceanic Soul', level: 6,
      source: 'The Fathomless', combat: true,
      desc: 'You gain resistance to cold damage. When you are fully submerged, any creature also fully submerged can understand your speech, and you can understand theirs.',
    },
    {
      id: 'fath-guardian-coil', name: 'Guardian Coil', level: 6,
      source: 'The Fathomless', combat: true,
      desc: 'When you or a creature you can see takes damage while within 10 ft of your Tentacle of the Deeps, you can use your reaction to reduce the damage to one of those creatures by 1d8 (2d8 at 10th level).',
    },
    {
      id: 'fath-grasping', name: 'Grasping Tentacles', level: 10,
      source: 'The Fathomless', combat: true,
      desc: "You learn Evard's Black Tentacles; it counts as a warlock spell for you and doesn't count against your spells known. You can cast it once without a slot, regaining that use on a long rest. Whenever you cast it you gain temporary hit points equal to your warlock level, and damage can't break your concentration on it. Use the free cast on the Combat tab.",
    },
    {
      id: 'fath-plunge', name: 'Fathomless Plunge', level: 14,
      source: 'The Fathomless', combat: true,
      desc: 'Action: teleport yourself and up to five willing creatures within 30 ft, appearing up to 1 mile away in (or within 30 ft of) a body of water you have seen that is pond-sized or larger. Once per short or long rest.',
    },
  ],
};
