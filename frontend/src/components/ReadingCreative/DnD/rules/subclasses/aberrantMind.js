export default {
  name: 'Aberrant Mind',
  className: 'Sorcerer',
  features: [
    { id: 'aberr-psionic-spells', name: 'Psionic Spells', level: 1, source: 'Aberrant Mind', combat: true,
      desc: 'You gain always-known psionic spells (they don\'t count against your spells known): 1st — Arms of Hadar, Dissonant Whispers, Mind Sliver; 3rd — Calm Emotions, Detect Thoughts; 5th — Hunger of Hadar, Sending; 7th — Evard\'s Black Tentacles, Summon Aberration; 9th — Rary\'s Telepathic Bond, Telekinesis. When you gain a sorcerer level you may swap one for a divination or enchantment spell from the sorcerer, warlock, or wizard list.' },
    { id: 'aberr-telepathic', name: 'Telepathic Speech', level: 1, source: 'Aberrant Mind', combat: true,
      desc: 'As a bonus action, choose a creature within 30 feet; you can speak telepathically with each other while within a number of miles equal to your Charisma modifier (minimum 1). The link lasts a number of minutes equal to your sorcerer level (ending early if you\'re incapacitated, die, or link a different creature).' },
    { id: 'aberr-psionic-sorcery', name: 'Psionic Sorcery', level: 6, source: 'Aberrant Mind', combat: true,
      desc: 'When you cast a Psionic Spell of 1st level or higher, you can cast it by spending sorcery points equal to its level instead of a spell slot; cast this way it needs no verbal, somatic, or (non-consumed) material components.' },
    { id: 'aberr-defenses', name: 'Psychic Defenses', level: 6, source: 'Aberrant Mind', combat: true,
      desc: 'You gain resistance to psychic damage and advantage on saving throws against being charmed or frightened.' },
    { id: 'aberr-revelation', name: 'Revelation in Flesh', level: 14, source: 'Aberrant Mind', combat: true,
      desc: 'As a bonus action, spend 1 or more sorcery points to transform for 10 minutes. Per point spent, choose a benefit: see invisible creatures within 60 ft; a flying speed equal to your walking speed (hover); a swimming speed twice your walking speed and breathe underwater; or become pliable — move through 1-inch gaps and spend 5 ft of movement to escape restraints/grapples.' },
    { id: 'aberr-warping', name: 'Warping Implosion', level: 18, source: 'Aberrant Mind', combat: true,
      desc: 'As an action, teleport to an unoccupied space within 120 feet. Each creature within 30 feet of the space you left makes a Strength save against your spell save DC, taking 3d10 force damage and being pulled toward your old space on a failure (half damage, no pull, on a success). Once you use this, you can\'t again until a long rest, unless you spend 5 sorcery points.' },
  ],
};
