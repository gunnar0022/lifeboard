export default {
  name: 'School of Necromancy',
  className: 'Wizard',
  features: [
    { id: 'necro-savant', name: 'Necromancy Savant', level: 2, source: 'School of Necromancy',
      desc: 'The gold and time you must spend to copy a necromancy spell into your spellbook is halved.' },
    { id: 'necro-grim-harvest', name: 'Grim Harvest', level: 2, source: 'School of Necromancy', combat: true,
      desc: 'Once per turn when you kill one or more creatures with a spell of 1st level or higher, you regain hit points equal to twice the spell\'s level, or three times its level if the spell belongs to the School of Necromancy. No benefit for killing constructs or undead. Use the reaper on the Combat tab to tally and apply the healing.' },
    { id: 'necro-undead-thralls', name: 'Undead Thralls', level: 6, source: 'School of Necromancy', combat: true,
      desc: 'You add Animate Dead to your spellbook. When you cast it, you can target one additional corpse or pile of bones. Any undead you create with a necromancy spell gains +your wizard level to its hit point maximum and adds your proficiency bonus to its weapon damage rolls. Muster your thralls on the Combat tab.' },
    { id: 'necro-inured', name: 'Inured to Undeath', level: 10, source: 'School of Necromancy', combat: true,
      desc: 'You have resistance to necrotic damage, and your hit point maximum can\'t be reduced.' },
    { id: 'necro-command-undead', name: 'Command Undead', level: 14, source: 'School of Necromancy', combat: true,
      desc: 'As an action, target one undead within 60 feet — it makes a Charisma save vs your spell save DC or becomes friendly and obeys you until you use this again. INT 8+ grants advantage on the save; INT 12+ can repeat the save each hour to break free. A success makes it immune to your future attempts.' },
  ],
};
