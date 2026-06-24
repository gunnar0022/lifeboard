/**
 * Battle Smith — Artificer specialist. A protector who fights beside a Steel
 * Defender construct. The Combat-tab BattleSmithBlock owns the HP-tracked
 * defender card (scaling with level + INT, +2 AC at 15th) and the Arcane Jolt
 * reaction pool. The Features-tab card carries an inline stat-block viewer
 * (statBlock: 'steelDefender') so the dense numbers read cleanly.
 */
export default {
  name: 'Battle Smith',
  className: 'Artificer',
  features: [
    {
      id: 'bs-tools', name: 'Tool Proficiency', level: 3,
      source: 'Battle Smith',
      desc: "You gain proficiency with smith's tools. If you already have it, gain proficiency with one other type of artisan's tools of your choice.",
    },
    {
      id: 'bs-spells', name: 'Battle Smith Spells', level: 3,
      source: 'Battle Smith',
      desc: "Always-prepared spells (they don't count against your prepared spells): 3rd Heroism, Shield · 5th Branding Smite, Warding Bond · 9th Aura of Vitality, Conjure Barrage · 13th Aura of Purity, Fire Shield · 17th Banishing Smite, Mass Cure Wounds. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'bs-battle-ready', name: 'Battle Ready', level: 3,
      source: 'Battle Smith', combat: true,
      desc: 'You gain proficiency with martial weapons. When you attack with a magic weapon, you can use your INT modifier, instead of STR or DEX, for the attack and damage rolls.',
    },
    {
      id: 'bs-steel-defender', name: 'Steel Defender', level: 3,
      source: 'Battle Smith', combat: true, statBlock: 'steelDefender',
      desc: "A faithful construct companion fights at your side. It shares your initiative and acts right after you, taking the Dodge action unless you spend a bonus action to command another action (when incapacitated, it acts freely). Its stats scale with your level, INT, and proficiency bonus (AC 15; HP = 2 + INT + 5 × your artificer level). Mending restores 2d6 HP; revive it within an hour as an action with smith's tools and a spell slot. Re-form it after a long rest. Summon and track its HP on the Combat tab.",
    },
    {
      id: 'bs-extra-attack', name: 'Extra Attack', level: 5,
      source: 'Battle Smith',
      desc: 'You can attack twice, rather than once, whenever you take the Attack action on your turn.',
    },
    {
      id: 'bs-arcane-jolt', name: 'Arcane Jolt', level: 9,
      source: 'Battle Smith', combat: true,
      desc: "When you hit with a magic weapon attack or your steel defender hits, you can channel energy: deal an extra 2d6 force damage, or heal a creature/object within 30 ft of the target for 2d6. Uses = your INT modifier (min once), no more than once per turn, regained on a long rest. Track uses on the Combat tab.",
    },
    {
      id: 'bs-improved-defender', name: 'Improved Defender', level: 15,
      source: 'Battle Smith', combat: true,
      desc: "Your Arcane Jolt's extra damage and healing both increase to 4d6. Your steel defender gains +2 AC, and whenever it uses Deflect Attack the attacker takes 1d4 + your INT modifier force damage.",
    },
  ],
};
