/**
 * The Undying — Warlock. A pact with a being that has cheated death (an ancient
 * deathless lord), granting resilience and self-healing. Combat hooks: the undead-
 * warding Among the Dead, and the two recovery features Defy Death and
 * Indestructible Life — surfaced on the UndyingBlock.
 */
export default {
  name: 'The Undying',
  className: 'Warlock',
  features: [
    {
      id: 'undy-spells', name: 'Undying Expanded Spells', level: 1,
      source: 'The Undying',
      desc: 'These spells are added to the warlock spell list for you: 1st False Life, Ray of Sickness · 2nd Blindness/Deafness, Silence · 3rd Feign Death, Speak with Dead · 4th Aura of Life, Death Ward · 5th Contagion, Legend Lore. Learn them as warlock spells on the Spells tab.',
    },
    {
      id: 'undy-among-dead', name: 'Among the Dead', level: 1,
      source: 'The Undying', combat: true,
      desc: 'You learn the Spare the Dying cantrip (a warlock cantrip for you) and have advantage on saving throws against disease. If an undead targets you directly with an attack or harmful spell, it must make a Wisdom save against your spell save DC or choose a new target (potentially wasting the attack); on a success, or if you target it, it is immune to this for 24 hours.',
    },
    {
      id: 'undy-defy-death', name: 'Defy Death', level: 6,
      source: 'The Undying', combat: true,
      desc: 'You can regain hit points equal to 1d8 + your Constitution modifier (min 1) when you succeed on a death saving throw or when you stabilize a creature with Spare the Dying. Once per long rest.',
    },
    {
      id: 'undy-nature', name: 'Undying Nature', level: 10,
      source: 'The Undying', combat: true,
      desc: "You can hold your breath indefinitely and don't require food, water, or sleep (though you still rest to reduce exhaustion and benefit from short and long rests). You age at 1 year per 10, and you are immune to magical aging.",
    },
    {
      id: 'undy-indestructible', name: 'Indestructible Life', level: 14,
      source: 'The Undying', combat: true,
      desc: 'Bonus action: regain hit points equal to 1d8 + your warlock level. If you put a severed body part of yours back in place when you use this, the part reattaches. Once per short or long rest.',
    },
  ],
};
