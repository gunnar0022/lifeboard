/**
 * Fey Wanderer — Ranger subclass. No companion; its combat texture is a
 * once-per-turn psychic rider, charm/fright control, and two free-cast pools
 * (Summon Fey at 11th, Misty Step at 15th) surfaced by FeyWandererBlock. The
 * Fey Wanderer Magic spells are always-prepared extras — pinned on the Spells
 * tab, like other subclass spell lists.
 */
export default {
  name: 'Fey Wanderer',
  className: 'Ranger',
  features: [
    {
      id: 'fw-dreadful', name: 'Dreadful Strikes', level: 3,
      source: 'Fey Wanderer', combat: true,
      desc: 'When you hit a creature with a weapon, you can deal an extra 1d4 psychic damage (1d6 at 11th level). A creature can take this extra damage only once per turn.',
    },
    {
      id: 'fw-magic', name: 'Fey Wanderer Magic', level: 3,
      source: 'Fey Wanderer',
      desc: "You learn an additional ranger spell at certain levels — it's always prepared and doesn't count against your spells known: 3rd Charm Person · 5th Misty Step · 9th Dispel Magic · 13th Dimension Door · 17th Mislead. Pin these as Always Prepared on the Spells tab.",
    },
    {
      id: 'fw-glamour', name: 'Otherworldly Glamour', level: 3,
      source: 'Fey Wanderer', combat: true,
      desc: 'Whenever you make a Charisma check, add your Wisdom modifier (minimum +1). You also gain proficiency in one of the following skills:',
      choice: 'option', group: 'feyChoices',
      options: [
        { name: 'Deception', desc: 'Proficiency in Deception.' },
        { name: 'Performance', desc: 'Proficiency in Performance.' },
        { name: 'Persuasion', desc: 'Proficiency in Persuasion.' },
      ],
    },
    {
      id: 'fw-beguiling', name: 'Beguiling Twist', level: 7,
      source: 'Fey Wanderer', combat: true,
      desc: 'You have advantage on saving throws against being charmed or frightened. Whenever you or a creature you can see within 120 ft. succeeds on a save against being charmed or frightened, you can use your reaction to force a different creature you can see within 120 ft. to make a Wisdom save vs. your spell save DC or be charmed or frightened (your choice) by you for 1 minute (repeats the save at the end of each of its turns).',
    },
    {
      id: 'fw-reinforcements', name: 'Fey Reinforcements', level: 11,
      source: 'Fey Wanderer', combat: true,
      desc: "You know Summon Fey — it doesn't count against your spells known and needs no material component. You can cast it once without a slot, regaining that use on a long rest. When you start casting it, you can choose to make it not require concentration; if you do, its duration becomes 1 minute for that casting.",
    },
    {
      id: 'fw-misty', name: 'Misty Wanderer', level: 15,
      source: 'Fey Wanderer', combat: true,
      desc: 'You can cast Misty Step without expending a spell slot a number of times equal to your Wisdom modifier (minimum once), regaining all uses on a long rest. Whenever you cast Misty Step, you can bring one willing creature within 5 ft. of you, teleporting it to an unoccupied space within 5 ft. of your destination.',
    },
  ],
};
