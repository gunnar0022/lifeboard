/**
 * Eldritch Invocation library — a starter set of the most-used PHB invocations.
 * The list is intentionally not exhaustive: the Warlock picker pairs this with a
 * lightweight custom builder so players can add any invocation (homebrew or one
 * we haven't authored) onto their own character without us hand-entering all of
 * them. Cap (invocations known) comes from invocationsKnown() in scaling.js.
 *
 * `prereq` is human-readable display text; `minLevel` gates availability in the
 * picker (0 = no level requirement). `pact` flags Pact-Boon prerequisites for
 * display only — we don't hard-block those.
 */
export const INVOCATION_LIST = [
  { name: 'Agonizing Blast', prereq: 'Eldritch Blast cantrip', minLevel: 0, desc: 'When you cast Eldritch Blast, add your Charisma modifier to the damage it deals on a hit.' },
  { name: 'Armor of Shadows', prereq: '', minLevel: 0, desc: 'You can cast Mage Armor on yourself at will, without expending a spell slot or material components.' },
  { name: 'Beguiling Influence', prereq: '', minLevel: 0, desc: 'You gain proficiency in the Deception and Persuasion skills.' },
  { name: 'Devil’s Sight', prereq: '', minLevel: 0, desc: 'You can see normally in darkness, both magical and nonmagical, to a distance of 120 feet.' },
  { name: 'Eldritch Spear', prereq: 'Eldritch Blast cantrip', minLevel: 0, desc: 'When you cast Eldritch Blast, its range is 300 feet.' },
  { name: 'Fiendish Vigor', prereq: '', minLevel: 0, desc: 'You can cast False Life on yourself at will as a 1st-level spell, without expending a spell slot or material components.' },
  { name: 'Mask of Many Faces', prereq: '', minLevel: 0, desc: 'You can cast Disguise Self at will, without expending a spell slot.' },
  { name: 'Repelling Blast', prereq: 'Eldritch Blast cantrip', minLevel: 0, desc: 'When you hit a creature with Eldritch Blast, you can push it up to 10 feet away from you in a straight line.' },
  { name: 'Thirsting Blade', prereq: 'Pact of the Blade, level 5', minLevel: 5, pact: 'Pact of the Blade', desc: 'You can attack with your pact weapon twice, instead of once, whenever you take the Attack action on your turn.' },
  { name: 'Book of Ancient Secrets', prereq: 'Pact of the Tome', minLevel: 0, pact: 'Pact of the Tome', desc: 'You can inscribe and cast ritual spells from your Book of Shadows.' },
  { name: 'Voice of the Chain Master', prereq: 'Pact of the Chain', minLevel: 0, pact: 'Pact of the Chain', desc: 'You can communicate telepathically with your familiar and perceive through its senses as long as you are on the same plane of existence.' },
  { name: 'Mire the Mind', prereq: 'Level 5', minLevel: 5, desc: 'You can cast Slow once using a warlock spell slot. You can’t do so again until you finish a long rest.' },
  { name: 'One with Shadows', prereq: 'Level 5', minLevel: 5, desc: 'When you are in an area of dim light or darkness, you can use your action to become invisible until you move or take an action or reaction.' },
  { name: 'Ascendant Step', prereq: 'Level 9', minLevel: 9, desc: 'You can cast Levitate on yourself at will, without expending a spell slot or material components.' },
  { name: 'Whispers of the Grave', prereq: 'Level 9', minLevel: 9, desc: 'You can cast Speak with Dead at will, without expending a spell slot.' },
  { name: 'Witch Sight', prereq: 'Level 15', minLevel: 15, desc: 'You can see the true form of any shapechanger or creature concealed by illusion or transmutation magic while it is within 30 feet and in line of sight.' },
];
