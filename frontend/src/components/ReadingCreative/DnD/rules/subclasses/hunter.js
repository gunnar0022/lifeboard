/**
 * Hunter (Hunter's Conclave) — Ranger subclass.
 *
 * Every tier is a single "choose one of the following" decision: Hunter's Prey
 * (3), Defensive Tactics (7), Multiattack (11), Superior Hunter's Defense (15).
 * The picks are stored in `classFeature.hunterChoices` keyed by the tier id and
 * made on the Features tab via the generic `option` build-choice. The Combat-tab
 * HunterBlock reads the SAME HUNTER_TIERS to surface the chosen option — turning
 * the once-per-turn picks (Colossus Slayer / Horde Breaker) into live per-turn
 * toggles and the rest into reaction / action / passive reminders.
 *
 * `kind` drives the combat tracker: 'perTurn' gets a ready/used toggle,
 * 'reaction' | 'action' | 'passive' render as reminders. `combatNote` is the
 * terse Combat-tab line; `desc` is the full Features-tab text.
 */
export const HUNTER_TIERS = [
  {
    id: 'hunter-prey',
    name: "Hunter's Prey",
    level: 3,
    intro: 'Choose one of the following:',
    options: [
      {
        name: 'Colossus Slayer',
        kind: 'perTurn',
        combatNote: 'On a hit vs. a creature below its HP max: +1d8 damage. Once per turn.',
        desc: "Your tenacity can wear down the most potent foes. When you hit a creature with a weapon attack, the creature takes an extra 1d8 damage if it's below its hit point maximum. You can deal this extra damage only once per turn.",
      },
      {
        name: 'Giant Killer',
        kind: 'reaction',
        combatNote: 'When a Large+ creature within 5 ft hits or misses you, react to attack it.',
        desc: 'When a Large or larger creature within 5 feet of you hits or misses you with an attack, you can use your reaction to attack that creature immediately after its attack, provided that you can see the creature.',
      },
      {
        name: 'Horde Breaker',
        kind: 'perTurn',
        combatNote: 'Once per turn: a second weapon attack vs. a different creature within 5 ft of the first.',
        desc: 'Once on each of your turns when you make a weapon attack, you can make another attack with the same weapon against a different creature that is within 5 feet of the original target and within range of your weapon.',
      },
    ],
  },
  {
    id: 'hunter-defensive',
    name: 'Defensive Tactics',
    level: 7,
    intro: 'Choose one of the following:',
    options: [
      {
        name: 'Escape the Horde',
        kind: 'passive',
        combatNote: 'Opportunity attacks against you are made with disadvantage.',
        desc: 'Opportunity attacks against you are made with disadvantage.',
      },
      {
        name: 'Multiattack Defense',
        kind: 'reaction',
        combatNote: 'After a creature hits you: +4 AC vs. its further attacks for the rest of the turn.',
        desc: 'When a creature hits you with an attack, you gain a +4 bonus to AC against all subsequent attacks made by that creature for the rest of the turn.',
      },
      {
        name: 'Steel Will',
        kind: 'passive',
        combatNote: 'Advantage on saving throws against being frightened.',
        desc: 'You have advantage on saving throws against being frightened.',
      },
    ],
  },
  {
    id: 'hunter-multiattack',
    name: 'Multiattack',
    level: 11,
    intro: 'Choose one of the following:',
    options: [
      {
        name: 'Volley',
        kind: 'action',
        combatNote: 'Action: a ranged attack vs. any number of creatures within 10 ft of a point (ammo each).',
        desc: "You can use your action to make a ranged attack against any number of creatures within 10 feet of a point you can see within your weapon's range. You must have ammunition for each target, as normal, and you make a separate attack roll for each target.",
      },
      {
        name: 'Whirlwind Attack',
        kind: 'action',
        combatNote: 'Action: a melee attack vs. any number of creatures within 5 ft of you.',
        desc: 'You can use your action to make melee attacks against any number of creatures within 5 feet of you, with a separate attack roll for each target.',
      },
    ],
  },
  {
    id: 'hunter-superior',
    name: "Superior Hunter's Defense",
    level: 15,
    intro: 'Choose one of the following:',
    options: [
      {
        name: 'Evasion',
        kind: 'passive',
        combatNote: 'Succeed a DEX save for half damage → take none; fail → take half.',
        desc: "When you are subjected to an effect, such as a red dragon's fiery breath or a lightning bolt spell, that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw, and only half damage if you fail.",
      },
      {
        name: 'Stand Against the Tide',
        kind: 'reaction',
        combatNote: 'When a hostile creature misses you with melee, react to redirect that attack at another creature.',
        desc: 'When a hostile creature misses you with a melee attack, you can use your reaction to force that creature to repeat the same attack against another creature (other than itself) of your choice.',
      },
      {
        name: 'Uncanny Dodge',
        kind: 'reaction',
        combatNote: 'Reaction when an attacker you can see hits you: halve the damage.',
        desc: "When an attacker that you can see hits you with an attack, you can use your reaction to halve the attack's damage against you.",
      },
    ],
  },
];

// Features tab cards are derived from the tiers — each is a level-gated
// "choose one" via the generic `option` build-choice (stored in hunterChoices).
const features = HUNTER_TIERS.map(t => ({
  id: t.id,
  name: t.name,
  level: t.level,
  source: 'Hunter',
  combat: true,
  desc: t.intro,
  choice: 'option',
  group: 'hunterChoices',
  options: t.options.map(o => ({ name: o.name, desc: o.desc })),
}));

export default { name: 'Hunter', className: 'Ranger', features };
