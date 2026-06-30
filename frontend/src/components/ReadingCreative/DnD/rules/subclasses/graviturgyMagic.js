export default {
  name: 'Graviturgy Magic',
  className: 'Wizard',
  features: [
    { id: 'grav-adjust-density', name: 'Adjust Density', level: 2, source: 'Graviturgy Magic', combat: true,
      desc: 'As an action, alter the weight of one Large-or-smaller object or creature within 30 feet (Huge or smaller at 10th level) — halved or doubled for up to 1 minute (concentration). Halved: +10 ft speed, jump twice as far, disadvantage on Strength checks and saves. Doubled: −10 ft speed, advantage on Strength checks and saves. Track it on the Combat tab.' },
    { id: 'grav-gravity-well', name: 'Gravity Well', level: 6, source: 'Graviturgy Magic', combat: true,
      desc: 'Whenever you cast a spell on a creature, you can move the target 5 feet to an unoccupied space of your choice — if it is willing, the spell hits it with an attack, or it fails a save against the spell.' },
    { id: 'grav-violent-attraction', name: 'Violent Attraction', level: 10, source: 'Graviturgy Magic', combat: true,
      desc: 'Reaction when a creature you can see within 60 feet hits with a weapon attack: the target takes an extra 1d10 damage of the weapon\'s type. Alternatively, when a creature within 60 feet takes fall damage, add 2d10 to it. Uses equal to your Intelligence modifier (min 1), regained on a long rest.' },
    { id: 'grav-event-horizon', name: 'Event Horizon', level: 14, source: 'Graviturgy Magic', combat: true,
      desc: 'As an action, emit a gravitational field for up to 1 minute (concentration). Each turn a hostile creature starts within 30 feet, it makes a Strength save vs your spell DC: on a failure it takes 2d10 force damage and its speed drops to 0 until its next turn; on a success, half damage and every foot of movement costs 2 extra feet. Once used, you can\'t again until a long rest or until you expend a 3rd-level-or-higher spell slot on it. Track it on the Combat tab.' },
  ],
};
