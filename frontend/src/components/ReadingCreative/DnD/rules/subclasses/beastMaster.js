/**
 * Beast Master — Ranger subclass. The defining feature is a companion creature
 * that scales with ranger level & proficiency bonus. The Combat-tab BeastMasterBlock
 * owns the live card (Primal Companion stat blocks, or a freeform Classic beast)
 * with HP tracking; the Features tab carries an inline, level-aware stat-block
 * viewer (statBlock: 'primal') so the dense numbers read cleanly without a wall
 * of text. `combat` flags the table-relevant features.
 */
export default {
  name: 'Beast Master',
  className: 'Ranger',
  features: [
    {
      id: 'bm-companion', name: "Ranger's Companion / Primal Companion", level: 3,
      source: 'Beast Master', combat: true, statBlock: 'primal',
      desc: "A beast companion fights alongside you, acting on your initiative. Command it (Attack, Dash, Disengage, Help) with your action — otherwise it Dodges; you can move it for free on your turn. With Extra Attack, you also make one weapon attack when you command its Attack. Choose the classic ranger's beast (any CR 1/4 or lower, HP = 4 × your level) or the optional Primal Companion below — summon, swap variant, and track its HP in the Combat tab.",
    },
    {
      id: 'bm-exceptional', name: 'Exceptional Training', level: 7,
      source: 'Beast Master', combat: true,
      desc: "On any turn your beast doesn't attack, you can use a bonus action to command it to Dash, Disengage, or Help. Its attacks also count as magical for overcoming resistance and immunity to nonmagical damage.",
    },
    {
      id: 'bm-fury', name: 'Bestial Fury', level: 11,
      source: 'Beast Master', combat: true,
      desc: 'When you command your beast to take the Attack action, it can make two attacks — or it takes its Multiattack action if it has one.',
    },
    {
      id: 'bm-share', name: 'Share Spells', level: 15,
      source: 'Beast Master', combat: true,
      desc: 'When you cast a spell targeting yourself, you can also affect your beast companion with the spell if it is within 30 feet of you.',
    },
  ],
};
