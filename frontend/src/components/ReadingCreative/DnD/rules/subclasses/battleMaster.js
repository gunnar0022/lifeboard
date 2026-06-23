export default {
  name: 'Battle Master',
  className: 'Fighter',
  features: [
    { id: 'bm-superiority', name: 'Combat Superiority', level: 3, source: 'Battle Master', choice: 'maneuvers', combat: true,
      desc: 'You learn maneuvers fueled by superiority dice (d8s). You know three maneuvers (learning two more at 7th, 10th, and 15th level, and you can swap one each time), and you can use only one maneuver per attack. You have four superiority dice (a fifth at 7th, a sixth at 15th), regaining all of them on a short or long rest. Maneuver save DC = 8 + your proficiency bonus + your Strength or Dexterity modifier (your choice).' },
    { id: 'bm-student', name: 'Student of War', level: 3, source: 'Battle Master',
      desc: "You gain proficiency with one type of artisan's tools of your choice." },
    { id: 'bm-know-enemy', name: 'Know Your Enemy', level: 7, source: 'Battle Master', combat: true,
      desc: 'If you spend at least 1 minute observing or interacting with a creature outside combat, the DM tells you how it compares to you (equal, superior, or inferior) in two of: Strength, Dexterity, Constitution, AC, current hit points, total class levels, or fighter class levels.' },
    { id: 'bm-improved', name: 'Improved Combat Superiority', level: 10, source: 'Battle Master', combat: true,
      desc: 'Your superiority dice turn into d10s. At 18th level, they turn into d12s.' },
    { id: 'bm-relentless', name: 'Relentless', level: 15, source: 'Battle Master', combat: true,
      desc: 'When you roll initiative and have no superiority dice remaining, you regain 1 superiority die.' },
  ],
};
