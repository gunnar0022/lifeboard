export default {
  name: 'Path of the Giant',
  className: 'Barbarian',
  features: [
    { id: 'giant-power', name: "Giant's Power", level: 3, source: 'Path of the Giant', choice: 'giant-cantrip',
      desc: 'You learn to speak, read, and write Giant (or one other language of your choice if you already know Giant). Additionally, you learn either the druidcraft or thaumaturgy cantrip. Wisdom is your spellcasting ability for it.' },
    { id: 'giant-havoc', name: "Giant's Havoc", level: 3, source: 'Path of the Giant', combat: true,
      desc: 'While raging you gain two benefits. Crushing Throw: when you make a successful ranged attack with a thrown weapon using Strength, you can add your Rage Damage bonus to the damage roll. Giant Stature: your reach increases by 5 feet, and if you are smaller than Large you become Large (along with anything you are wearing), provided there is room.' },
    { id: 'giant-elemental-cleaver', name: 'Elemental Cleaver', level: 6, source: 'Path of the Giant', combat: true,
      desc: 'When you enter your rage, choose one weapon you are holding and infuse it with acid, cold, fire, thunder, or lightning. While you wield it during the rage, its damage type changes to the chosen type, it deals an extra 1d6 damage of that type on a hit (2d6 at 14th level), and it gains the thrown property (range 20/60); if thrown it returns to your hand the instant after it hits or misses. The infusion is suppressed while another creature wields it. As a bonus action while raging you can change the infused damage type to another option.' },
    { id: 'giant-mighty-impel', name: 'Mighty Impel', level: 10, source: 'Path of the Giant', combat: true,
      desc: 'As a bonus action while raging, choose one Medium or smaller creature within your reach and move it to an unoccupied space you can see within 30 feet of yourself. An unwilling creature must succeed on a Strength saving throw (DC = 8 + your proficiency bonus + your Strength modifier) to avoid the effect. If the creature ends this movement with no surface or liquid to support it, it falls, taking damage as normal and landing prone.' },
    { id: 'giant-demiurgic-colossus', name: 'Demiurgic Colossus', level: 14, source: 'Path of the Giant', combat: true,
      desc: 'When you rage, your reach increases by 10 feet, your size can increase to Large or Huge (your choice), and your Mighty Impel can move creatures that are Large or smaller. In addition, the extra damage dealt by your Elemental Cleaver increases to 2d6.' },
  ],
};
