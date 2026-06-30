export default {
  name: 'School of Enchantment',
  className: 'Wizard',
  features: [
    { id: 'ench-savant', name: 'Enchantment Savant', level: 2, source: 'School of Enchantment',
      desc: 'The gold and time you must spend to copy an enchantment spell into your spellbook is halved.' },
    { id: 'ench-hypnotic-gaze', name: 'Hypnotic Gaze', level: 2, source: 'School of Enchantment', combat: true,
      desc: 'As an action, choose a creature within 5 feet that can see or hear you. It must succeed on a Wisdom save vs your spell save DC or be charmed until the end of your next turn — speed 0, incapacitated, visibly dazed. Each turn you can use your action to maintain it. It ends if you move more than 5 feet away, the creature can\'t see or hear you, or it takes damage. Once it ends (or the creature saves), you can\'t use this on that creature again until you finish a long rest. Track the gaze on the Combat tab.' },
    { id: 'ench-instinctive-charm', name: 'Instinctive Charm', level: 6, source: 'School of Enchantment', combat: true,
      desc: 'When a creature you can see within 30 feet makes an attack roll against you, you can use your reaction to force a Wisdom save (vs your spell save DC), provided another creature is within the attack\'s range. On a failure it must target the creature closest to it instead (not you or itself). On a success, you can\'t use this on that attacker again until a long rest. Decide before knowing the result; creatures immune to charm are unaffected.' },
    { id: 'ench-split', name: 'Split Enchantment', level: 10, source: 'School of Enchantment', combat: true,
      desc: 'When you cast an enchantment spell of 1st level or higher that targets only one creature, you can have it target a second creature.' },
    { id: 'ench-alter-memories', name: 'Alter Memories', level: 14, source: 'School of Enchantment', combat: true,
      desc: 'When you cast an enchantment spell to charm one or more creatures, you can make one of them unaware it was charmed. Additionally, once before the spell expires you can use your action to force an Intelligence save (vs your spell save DC); on a failure the creature forgets up to 1 + your Charisma modifier (min 1) hours of the time it spent charmed.' },
  ],
};
