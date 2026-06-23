export default {
  name: 'Path of the Battlerager',
  className: 'Barbarian',
  features: [
    { id: 'btr-armor', name: 'Battlerager Armor', level: 3, source: 'Path of the Battlerager', combat: true,
      desc: 'Restricted to dwarves (your DM may lift this). While wearing spiked armor and raging, you can use a bonus action to make one melee weapon attack with your armor spikes against a target within 5 feet. On a hit the spikes deal 1d4 piercing damage, using your Strength modifier for the attack and damage rolls. Additionally, when you use the Attack action to grapple a creature, the target takes 3 piercing damage if your grapple check succeeds.' },
    { id: 'btr-reckless-abandon', name: 'Reckless Abandon', level: 6, source: 'Path of the Battlerager', combat: true,
      desc: 'When you use Reckless Attack while raging, you also gain temporary hit points equal to your Constitution modifier (minimum of 1). They vanish if any of them are left when your rage ends.' },
    { id: 'btr-charge', name: 'Battlerager Charge', level: 10, source: 'Path of the Battlerager', combat: true,
      desc: 'You can take the Dash action as a bonus action while you are raging.' },
    { id: 'btr-spiked-retribution', name: 'Spiked Retribution', level: 14, source: 'Path of the Battlerager', combat: true,
      desc: 'When a creature within 5 feet of you hits you with a melee attack, the attacker takes 3 piercing damage if you are raging, aren\'t incapacitated, and are wearing spiked armor.' },
  ],
};
