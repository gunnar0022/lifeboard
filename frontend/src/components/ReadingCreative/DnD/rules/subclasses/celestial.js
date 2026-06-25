/**
 * The Celestial — Warlock. A patron of the Upper Planes turns the warlock into
 * a conduit for radiant light. Combat hooks: the Healing Light d6 pool, the
 * radiant/fire damage boost of Radiant Soul, the rest-granted temp HP of
 * Celestial Resistance, and the once-per-long-rest revival of Searing Vengeance —
 * all surfaced on the CelestialBlock.
 */
export default {
  name: 'The Celestial',
  className: 'Warlock',
  features: [
    {
      id: 'cel-spells', name: 'Celestial Expanded Spells', level: 1,
      source: 'The Celestial',
      desc: "These spells are added to the warlock spell list for you: 1st Cure Wounds, Guiding Bolt · 2nd Flaming Sphere, Lesser Restoration · 3rd Daylight, Revivify · 4th Guardian of Faith, Wall of Fire · 5th Flame Strike, Greater Restoration. Learn them as warlock spells on the Spells tab.",
    },
    {
      id: 'cel-cantrips', name: 'Bonus Cantrips', level: 1,
      source: 'The Celestial',
      desc: 'You learn the Light and Sacred Flame cantrips. They count as warlock cantrips for you but don\'t count against your number of cantrips known — add them on the Spells tab.',
    },
    {
      id: 'cel-healing-light', name: 'Healing Light', level: 1,
      source: 'The Celestial', combat: true,
      desc: 'You have a pool of d6s equal to 1 + your warlock level. Bonus action: heal a creature within 60 ft, spending up to your Charisma modifier dice (minimum 1) and restoring HP equal to the total rolled. The pool refills on a long rest. Track and spend the pool on the Combat tab.',
    },
    {
      id: 'cel-radiant-soul', name: 'Radiant Soul', level: 6,
      source: 'The Celestial', combat: true,
      desc: 'You gain resistance to radiant damage. When you cast a spell that deals radiant or fire damage, add your Charisma modifier to one radiant or fire damage roll of that spell against one of its targets.',
    },
    {
      id: 'cel-resistance', name: 'Celestial Resistance', level: 10,
      source: 'The Celestial', combat: true,
      desc: 'When you finish a short or long rest, you gain temporary hit points equal to your warlock level + your Charisma modifier. Additionally, choose up to five creatures you can see; each gains temporary hit points equal to half your warlock level + your Charisma modifier. Grant your own temp HP on the Combat tab.',
    },
    {
      id: 'cel-searing-vengeance', name: 'Searing Vengeance', level: 14,
      source: 'The Celestial', combat: true,
      desc: 'When you must make a death saving throw at the start of your turn, you can instead spring up with a burst of radiant energy: regain hit points equal to half your hit point maximum, then stand if you choose. Each creature of your choice within 30 ft takes 2d8 + your Charisma modifier radiant damage and is blinded until the end of the turn. Once per long rest.',
    },
  ],
};
