/**
 * Knowledge Domain — Cleric. The seeker of secrets. Two Channel Divinity options
 * (Knowledge of the Ages, then Read Thoughts at 6th) headline the cleric-styled
 * KnowledgeDomainBlock, with the once-per-rest Visions of the Past tracked below.
 */
export default {
  name: 'Knowledge Domain',
  className: 'Cleric',
  features: [
    {
      id: 'know-spells', name: 'Knowledge Domain Spells', level: 1,
      source: 'Knowledge Domain',
      desc: "Always-prepared domain spells (they don't count against your prepared spells): 1st Command, Identify · 3rd Augury, Suggestion · 5th Nondetection, Speak with Dead · 7th Arcane Eye, Confusion · 9th Legend Lore, Scrying. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'know-blessings', name: 'Blessings of Knowledge', level: 1,
      source: 'Knowledge Domain',
      desc: 'You learn two languages of your choice and gain proficiency in two of: Arcana, History, Nature, or Religion. Your proficiency bonus is doubled for any ability check using either of those two skills.',
    },
    {
      id: 'know-ages', name: 'Channel Divinity: Knowledge of the Ages', level: 2,
      source: 'Knowledge Domain', combat: true,
      desc: 'Action: spend a Channel Divinity use to gain proficiency with one skill or tool of your choice for 10 minutes. Spend the use on the Combat tab.',
    },
    {
      id: 'know-thoughts', name: 'Channel Divinity: Read Thoughts', level: 6,
      source: 'Knowledge Domain', combat: true,
      desc: "Action: spend a Channel Divinity use; one creature within 60 ft makes a WIS save (on success, you can't target it again until a long rest). On a failure you read its surface thoughts for 1 minute while it's within 60 ft, and can use an action to end the effect and cast Suggestion on it (no slot, automatic failure).",
    },
    {
      id: 'know-potent', name: 'Potent Spellcasting', level: 8,
      source: 'Knowledge Domain', combat: true,
      desc: 'You add your Wisdom modifier to the damage you deal with any cleric cantrip.',
    },
    {
      id: 'know-visions', name: 'Visions of the Past', level: 17,
      source: 'Knowledge Domain', combat: true,
      desc: 'Meditate (concentration) up to your WIS score in minutes to glimpse the past: Object Reading (an object\'s owners and how they gained/lost it) or Area Reading (significant events in a 50-ft cube, going back days equal to your WIS score). Once per short or long rest. Track it on the Combat tab.',
    },
  ],
};
