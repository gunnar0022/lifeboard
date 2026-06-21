export default {
  name: 'War Magic',
  className: 'Wizard',
  features: [
    { id: 'wm-arcane-deflection', name: 'Arcane Deflection', level: 2, source: 'War Magic', combat: true,
      desc: 'Reaction when hit by an attack or you fail a save: gain +2 AC against that attack, or +4 to that save. Until the end of your next turn you can then cast only cantrips. At 14th level, this also arcs force damage (see Deflecting Shroud).' },
    { id: 'wm-tactical-wit', name: 'Tactical Wit', level: 2, source: 'War Magic', combat: true,
      desc: 'Add your Intelligence modifier to your initiative rolls.' },
    { id: 'wm-power-surge', name: 'Power Surge', level: 6, source: 'War Magic', combat: true,
      desc: 'Store power surges up to your Intelligence modifier (min 1). Resets to one on a long rest; gain one when you end a spell with Dispel Magic or Counterspell, and one if you end a short rest with none. Once per turn when you deal damage with a wizard spell, spend a surge to deal extra force damage equal to half your wizard level.' },
    { id: 'wm-durable-magic', name: 'Durable Magic', level: 10, source: 'War Magic', combat: true,
      desc: 'While you maintain concentration on a spell, you have a +2 bonus to AC and all saving throws.' },
    { id: 'wm-deflecting-shroud', name: 'Deflecting Shroud', level: 14, source: 'War Magic', combat: true,
      desc: 'When you use Arcane Deflection, magical energy arcs to up to three creatures of your choice within 60 feet, each taking force damage equal to half your wizard level.' },
  ],
};
