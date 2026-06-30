/**
 * Beginner-facing help content for the character sheet. Each topic maps to a
 * title plus one or more "sections" that become sub-tabs inside the help modal,
 * so newcomers get bite-sized panels instead of one giant wall of text.
 *
 * Block types a section can hold:
 *   { type: 'p', text }                       — a paragraph
 *   { type: 'list', items: [{ term, text }] } — a labelled list (term optional)
 *   { type: 'tip', text }                     — a highlighted tip callout
 *
 * Topic keys match the tab ids in TAB_REGISTRY, plus 'topbar' (the stat block
 * across the top of the sheet) and 'editmode' (the Edit toggle).
 */
export const HELP_CONTENT = {
  topbar: {
    title: 'Your Vital Stats',
    intro: 'The bar across the top of the sheet holds the numbers you reach for most in play — your health, defenses, and a few identity traits. Here is what each one means.',
    sections: [
      {
        id: 'survival',
        label: 'Staying Alive',
        blocks: [
          { type: 'list', items: [
            { term: 'Hit Points (HP)', text: 'Your health. Damage subtracts from your current HP; healing adds it back, never above your maximum. At 0 HP you fall unconscious and start making death saves.' },
            { term: 'Temporary HP', text: 'A buffer some spells and abilities grant. It sits on top of your HP and is spent first. Temp HP does not stack — you keep the larger amount.' },
            { term: 'Armor Class (AC)', text: 'How hard you are to hit. An attacker must roll equal to or above your AC to land a blow. Your armor and shield set this automatically once equipped.' },
            { term: 'Death Saves', text: 'When you are at 0 HP, on each of your turns you roll a d20. 10 or higher is a success, lower is a failure. Three successes and you stabilize; three failures and your character dies. A roll of 1 counts as two failures; a 20 brings you back with 1 HP.' },
          ] },
          { type: 'tip', text: 'Use the +/- buttons on HP during combat instead of editing the number — it is faster and harder to fat-finger.' },
        ],
      },
      {
        id: 'actions',
        label: 'Acting & Moving',
        blocks: [
          { type: 'list', items: [
            { term: 'Initiative', text: 'Decides turn order at the start of combat. Everyone rolls a d20 and adds this number; highest goes first. It is based on your Dexterity.' },
            { term: 'Speed', text: 'How many feet you can move on your turn. Most characters move 30 ft; some races are faster or slower.' },
            { term: 'Proficiency Bonus', text: 'A single number that scales with your level (+2 at level 1, up to +6). It is added to anything you are "proficient" with — trained skills, your class\'s weapons, your spell attacks, and more.' },
            { term: 'Hit Dice', text: 'Your reservoir of self-healing. On a short rest you can spend Hit Dice to recover HP. You regain spent dice on a long rest.' },
          ] },
        ],
      },
      {
        id: 'identity',
        label: 'Identity',
        blocks: [
          { type: 'list', items: [
            { term: 'Passive Perception', text: 'How alert you are without actively looking. The DM uses this in secret to see whether you notice hidden things (a trap, an ambush) — you do not have to roll.' },
            { term: 'Size', text: 'Most player characters are Medium. Size affects how much space you take up, what you can squeeze past, and your carrying capacity.' },
            { term: 'Creature Type (Body)', text: 'What kind of being you are — Humanoid, Fey, Construct, and so on. Some spells and effects only target (or spare) certain types.' },
          ] },
        ],
      },
    ],
  },

  stats: {
    title: 'Stats & Skills',
    intro: 'Almost everything your character attempts in D&D traces back to this tab. When the DM asks for a roll — to leap a chasm, recall a legend, charm a guard, or shrug off a poison — the relevant ability score or skill from this page is what you add to your d20.',
    sections: [
      {
        id: 'basics',
        label: 'How It Works',
        blocks: [
          { type: 'p', text: 'Your character is described by six ability scores. Each score has a modifier (the number in parentheses) — that modifier is what you actually add to rolls. A 10–11 is average (+0); higher is better.' },
          { type: 'p', text: 'A skill (like Stealth or Persuasion) is a specialty tied to one ability. If you are proficient in a skill, you also add your proficiency bonus to checks with it — representing real training.' },
          { type: 'p', text: 'Saving throws are reactive rolls: you make them to resist something happening to you — dodging a fireball, shaking off a charm, enduring poison. Your class grants proficiency in two of them.' },
          { type: 'tip', text: 'Roll a d20, add the ability modifier, add your proficiency bonus if you are trained, and compare to a target number the DM sets. That single pattern covers the vast majority of the game.' },
        ],
      },
      {
        id: 'physical',
        label: 'The Body (STR/DEX/CON)',
        blocks: [
          { type: 'list', items: [
            { term: 'Strength', text: 'Raw muscle. Hitting hard with heavy weapons, shoving, climbing, breaking things. The signature stat of front-line Fighters, Barbarians, and Paladins.' },
            { term: 'Dexterity', text: 'Agility and reflexes. Finesse weapons, ranged attacks, stealth, dodging, and Initiative. Loved by Rogues, Rangers, and Monks — and useful to everyone.' },
            { term: 'Constitution', text: 'Stamina and toughness. It boosts your hit points and helps you hold concentration on spells. Every class wants a healthy Constitution.' },
          ] },
        ],
      },
      {
        id: 'mental',
        label: 'The Mind (INT/WIS/CHA)',
        blocks: [
          { type: 'list', items: [
            { term: 'Intelligence', text: 'Knowledge and reasoning. Recalling lore, investigating clues, and the spellcasting stat for Wizards and Artificers.' },
            { term: 'Wisdom', text: 'Awareness and intuition. Perception, insight into people, and the spellcasting stat for Clerics, Druids, and Rangers.' },
            { term: 'Charisma', text: 'Force of personality. Persuasion, deception, performance, and the spellcasting stat for Bards, Sorcerers, Warlocks, and Paladins.' },
          ] },
        ],
      },
    ],
  },

  combat: {
    title: 'Combat',
    intro: 'This is your turn-by-turn cheat sheet during a fight: your attacks, your class\'s combat resources (like Rage or spell-like powers), your racial tricks, and your proficiencies — all in one place so you are never digging through rulebooks mid-battle.',
    sections: [
      {
        id: 'economy',
        label: 'The Action Economy',
        blocks: [
          { type: 'p', text: 'On your turn you generally get three things to spend, plus a reaction you can use even when it is not your turn:' },
          { type: 'list', items: [
            { term: 'Move', text: 'Travel up to your Speed in feet. You can break it up — move, act, then move again.' },
            { term: 'Action', text: 'The big one: Attack, cast a spell, Dash, Dodge, Hide, Help, and more. You get one per turn.' },
            { term: 'Bonus Action', text: 'A quick extra you only get if a specific feature grants one (a second weapon, a Barbarian\'s Rage, certain spells). You cannot invent one.' },
            { term: 'Reaction', text: 'One per round, used in response to a trigger — most often an opportunity attack when an enemy leaves your reach.' },
          ] },
        ],
      },
      {
        id: 'whats-here',
        label: 'What\'s On This Tab',
        blocks: [
          { type: 'list', items: [
            { term: 'Class Features', text: 'Your class\'s combat powers and their resources — the left column tracks things like Rage uses, Channel Divinity, or sorcery points.' },
            { term: 'Attacks', text: 'Your weapon attacks with to-hit and damage already calculated. Weapons you equip on the Equipment tab show up here automatically.' },
            { term: 'Racial Attacks & Traits', text: 'Natural weapons and once-per-rest racial powers (claws, breath weapons, and the like).' },
            { term: 'Proficiencies', text: 'A quick reference of the weapons, armor, and tools you are trained with.' },
          ] },
          { type: 'tip', text: 'The "to hit" and damage numbers already include your ability modifier and proficiency bonus — just roll the d20 it shows and add nothing extra unless a feature says so.' },
        ],
      },
    ],
  },

  spells: {
    title: 'Spells',
    intro: 'Many classes wield magic. If yours does, this tab is mission control for your spells — what you can cast, how often, and the resources that power it. Non-casters will not see this tab at all.',
    sections: [
      {
        id: 'slots',
        label: 'Slots & Cantrips',
        blocks: [
          { type: 'p', text: 'Casting most spells costs a spell slot. You have a limited number of slots of each level; casting expends one, and you get them back on a rest (usually a long rest). This sheet tracks your slots automatically based on your class and level.' },
          { type: 'list', items: [
            { term: 'Cantrips', text: 'Level-0 spells you can cast at will, for free, as often as you like — they never use a slot. Great reliable options every turn.' },
            { term: 'Upcasting', text: 'Spending a higher-level slot on a lower-level spell often makes it stronger. The cast screen shows you the boosted effect.' },
          ] },
        ],
      },
      {
        id: 'known-prepared',
        label: 'Known vs. Prepared',
        blocks: [
          { type: 'p', text: 'Classes get their spells in one of two ways, and it changes how you manage this tab:' },
          { type: 'list', items: [
            { term: 'Known spells', text: 'A fixed list you learn permanently (Sorcerers, Bards, Warlocks, Rangers). Anything you know, you can always cast.' },
            { term: 'Prepared spells', text: 'You have access to a big list but each day choose a smaller set to have ready (Clerics, Druids, Wizards, Paladins). You can swap your prepared spells after a long rest.' },
          ] },
        ],
      },
      {
        id: 'key-numbers',
        label: 'Key Numbers',
        blocks: [
          { type: 'list', items: [
            { term: 'Spellcasting Ability', text: 'The mental stat your class casts with (INT, WIS, or CHA). It powers the two numbers below.' },
            { term: 'Spell Attack Bonus', text: 'What you add to the d20 when a spell requires an attack roll (like a Fire Bolt aimed at a target).' },
            { term: 'Spell Save DC', text: 'When your spell forces an enemy to make a saving throw, this is the number they must beat to resist it.' },
            { term: 'Concentration', text: 'Some spells stay active only while you concentrate. You can concentrate on one at a time, and taking damage can break it (roll a Constitution save). The sheet flags your active concentration spell.' },
          ] },
        ],
      },
      {
        id: 'sources-homebrew',
        label: 'Other Sources & Homebrew',
        blocks: [
          { type: 'p', text: 'Magic does not only come from your class. Magic items, certain feats, and racial traits can grant spells too — those show up here as granted spells with their own usage rules.' },
          { type: 'tip', text: 'If the library is missing a spell, or you are running homebrew, use "Create New Spell" inside the Add Spell window to add your own. It is saved to the database for next time.' },
        ],
      },
    ],
  },

  equipment: {
    title: 'Equipment',
    intro: 'Everything your character carries lives here — the weapons and armor you fight in, plus all the gear, treasure, and odds and ends you pick up along the way. Your money is tracked here too.',
    sections: [
      {
        id: 'gear',
        label: 'Weapons & Armor',
        blocks: [
          { type: 'p', text: 'Add items from the library or create your own. The important part: equip them.' },
          { type: 'tip', text: 'Equipped weapons appear automatically as attacks on your Combat tab, and equipped armor and shields are folded into your AC for you. No manual math required.' },
        ],
      },
      {
        id: 'stuff',
        label: 'Gear & Money',
        blocks: [
          { type: 'p', text: 'The rest of your pack — rope, torches, potions, rations, trinkets, quest items — is tracked as inventory so you always know what you are hauling around.' },
          { type: 'p', text: 'Your coin (copper, silver, gold, and so on) is recorded here. Update it as you spend on supplies or haul home treasure.' },
        ],
      },
    ],
  },

  features: {
    title: 'Features',
    intro: 'As your character grows, they collect abilities, powers, and perks. This tab is the running list of everything they can do that is not a basic attack or spell.',
    sections: [
      {
        id: 'auto',
        label: 'Automatic Progression',
        blocks: [
          { type: 'p', text: 'Features from your race, class, and subclass are filled in for you. As you level up, new ones appear at the right levels — you do not have to type them in.' },
        ],
      },
      {
        id: 'other',
        label: 'The "Other" Section',
        blocks: [
          { type: 'p', text: 'Not everything comes from your class. Your background, feats, boons from the story, and other one-off sources of power belong in the "Other" category.' },
          { type: 'tip', text: 'Use "Other" for anything the automatic progression cannot know about — a feat you chose, a blessing from an NPC, a special trait your DM handed you.' },
        ],
      },
    ],
  },

  info: {
    title: 'Info',
    intro: 'This is the flavor tab — the human side of your character, separate from the rules and numbers.',
    sections: [
      {
        id: 'overview',
        label: 'Your Character',
        blocks: [
          { type: 'p', text: 'Track backstory, appearance, personality, ideals, bonds, flaws, allies, goals — whatever helps you bring the character to life at the table.' },
          { type: 'p', text: 'Nothing here affects your mechanics. It is purely a space for the story of who your character is.' },
        ],
      },
    ],
  },

  notes: {
    title: 'Notes',
    intro: 'Your campaign journal. As the adventure unfolds, this is where you keep track of everything you learn so you are not relying on memory between sessions.',
    sections: [
      {
        id: 'overview',
        label: 'Keeping a Journal',
        blocks: [
          { type: 'p', text: 'Jot down the things that matter: the names of people you meet, quest hooks and rumors, intriguing items, important locations, and unanswered questions.' },
          { type: 'tip', text: 'Good notes are one of the biggest things separating a smooth campaign from a confusing one. A few lines after each session pays off for months.' },
        ],
      },
    ],
  },

  encyclopedia: {
    title: 'Encyclopedia',
    intro: 'A general-purpose reference for exploring D&D itself — not tied to your specific character.',
    sections: [
      {
        id: 'overview',
        label: 'How to Use It',
        blocks: [
          { type: 'p', text: 'Browse the races and classes to learn what is possible, compare options when planning a new character, or look up the exact wording of a spell when a question comes up mid-game.' },
          { type: 'p', text: 'Think of it as the rulebook shelf built into the app — a place to learn and verify rather than to track your own character.' },
        ],
      },
    ],
  },

  editmode: {
    title: 'Edit Mode',
    intro: 'The Edit toggle unlocks the sheet so you can change things the automatic systems do not cover. Flipping it on or off is completely harmless and can be done at any time.',
    sections: [
      {
        id: 'what',
        label: 'What You Can Change',
        blocks: [
          { type: 'p', text: 'In edit mode you can add entries to the Features tab, mark new skill or save proficiencies, add a custom combat ability, adjust your background, rename things, reorder or hide tabs, and more.' },
        ],
      },
      {
        id: 'why',
        label: 'Why It Exists',
        blocks: [
          { type: 'p', text: 'A digital sheet is rigid; real games are not. Edit mode is here to fill the gaps — to capture the homebrew rulings, story rewards, and special cases a fixed character sheet cannot anticipate.' },
          { type: 'tip', text: 'It is a flexibility tool, not a cheat button. Use it to keep your sheet accurate to what is actually happening in your game.' },
        ],
      },
    ],
  },
};
