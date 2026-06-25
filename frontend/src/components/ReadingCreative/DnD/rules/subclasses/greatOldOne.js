/**
 * The Great Old One — Warlock. A pact with an unfathomable entity of the Far
 * Realm, granting telepathy and mind-bending defenses. Combat hooks: the
 * Entropic Ward reaction, the psychic-reflecting Thought Shield, and the
 * Create Thrall domination — surfaced on the GreatOldOneBlock.
 */
export default {
  name: 'The Great Old One',
  className: 'Warlock',
  features: [
    {
      id: 'goo-spells', name: 'Great Old One Expanded Spells', level: 1,
      source: 'The Great Old One',
      desc: "These spells are added to the warlock spell list for you: 1st Dissonant Whispers, Tasha's Hideous Laughter · 2nd Detect Thoughts, Phantasmal Force · 3rd Clairvoyance, Sending · 4th Dominate Beast, Evard's Black Tentacles · 5th Dominate Person, Telekinesis. Learn them as warlock spells on the Spells tab.",
    },
    {
      id: 'goo-awakened', name: 'Awakened Mind', level: 1,
      source: 'The Great Old One', combat: true,
      desc: 'You can telepathically speak to any creature you can see within 30 ft. It need not share a language with you, but must be able to understand at least one language.',
    },
    {
      id: 'goo-entropic', name: 'Entropic Ward', level: 6,
      source: 'The Great Old One', combat: true,
      desc: 'Reaction when a creature makes an attack roll against you: impose disadvantage on the roll. If the attack misses, your next attack roll against that creature before the end of your next turn has advantage. Once per short or long rest.',
    },
    {
      id: 'goo-thought-shield', name: 'Thought Shield', level: 10,
      source: 'The Great Old One', combat: true,
      desc: "Your thoughts can't be read by telepathy or other means unless you allow it. You gain resistance to psychic damage, and whenever a creature deals psychic damage to you, it takes the same amount of damage you do.",
    },
    {
      id: 'goo-create-thrall', name: 'Create Thrall', level: 14,
      source: 'The Great Old One', combat: true,
      desc: 'Action: touch an incapacitated humanoid to charm it until Remove Curse is cast on it, the charmed condition is removed, or you use this feature again. You can communicate telepathically with the thrall while on the same plane. Track your thrall on the Combat tab.',
    },
  ],
};
