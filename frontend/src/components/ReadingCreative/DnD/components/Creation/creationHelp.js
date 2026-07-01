/**
 * Plain-language helper text for each creation step — the optional "New to this?"
 * disclosure. Written for a first-time player: what the choice is and what it
 * mechanically affects down the line.
 */
export const CREATION_HELP = {
  race: {
    title: 'Choosing a race',
    body: [
      'Your race (ancestry) is who your character is at birth — elf, dwarf, human, and so on. It sets small permanent bonuses to your ability scores, your speed and size, and a handful of innate traits like darkvision or a breath weapon.',
      'It rarely locks you out of anything, so pick what you want to roleplay. The ability bonuses are pre-filled for you on the Abilities step, but you can move them around later if your table allows it.',
    ],
  },
  class: {
    title: 'Choosing a class',
    body: [
      'Your class is what your character does — the fighter swings steel, the wizard slings spells, the cleric channels a god. It is the single biggest mechanical decision: it sets your hit points, what you are proficient with, and the features you gain as you level.',
      'A few classes (Cleric, Sorcerer, Warlock) pick a subclass right away at level 1; most choose one at level 3. If your class picks now, you can browse and lock a subclass here — otherwise you will be prompted at the right level.',
    ],
  },
  abilities: {
    title: 'Setting ability scores',
    body: [
      'The six abilities (STR, DEX, CON, INT, WIS, CHA) underpin almost every roll. You have 27 points to spend raising base scores from 8 to 15 — higher scores cost more.',
      'Your racial bonuses are already added on top (the middle column). Lead with your class\'s main ability: DEX or STR for martials, and the spellcasting ability for casters (INT wizard, WIS cleric/druid, CHA bard/sorcerer/warlock/paladin).',
    ],
  },
  background: {
    title: 'Choosing a background',
    body: [
      'Your background is what you did before adventuring — soldier, criminal, sage, athlete. It grants a couple of skill proficiencies, sometimes tools or languages, a bit of starting gear, and a roleplay feature.',
      'Picking one here applies its proficiencies and languages to your sheet automatically. You can edit them afterward, or choose "Custom / none" to fill it in yourself.',
    ],
  },
  alignment: {
    title: 'Choosing an alignment',
    body: [
      'Alignment is a two-axis shorthand for your character\'s morals (good–evil) and their view of order (lawful–chaotic). It has almost no mechanical weight in modern play — it is a roleplay compass, not a rulebook.',
      'Pick the one that fits the character you imagine, or skip it and decide later.',
    ],
  },
  identity: {
    title: 'Name & identity',
    body: [
      'Last, the fun part: who is this person? Name them, sketch their appearance, and jot a personality trait, ideal, bond, and flaw to give them a voice at the table.',
      'None of this is mechanical — it is the flavor that makes the numbers feel like a character. You can change any of it anytime on the sheet.',
    ],
  },
  review: {
    title: 'Review & create',
    body: [
      'Give everything a last look. When you create the character, a full sheet opens in edit mode so you can finish the details this guided flow doesn\'t cover yet.',
    ],
  },
};
