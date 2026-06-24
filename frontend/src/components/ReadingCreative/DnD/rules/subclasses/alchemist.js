/**
 * Alchemist — Artificer specialist. The signature is the Experimental Elixir:
 * the Combat-tab AlchemistBlock is a brewing bench of flasks (rolled or chosen)
 * you drink for varied effects, plus the Lesser Restoration reserve and the
 * Chemical Mastery once-per-rest big heals. Always-prepared spells and the
 * passive boosts ride as Features-tab cards.
 */
export default {
  name: 'Alchemist',
  className: 'Artificer',
  features: [
    {
      id: 'alch-tools', name: 'Tool Proficiency', level: 3,
      source: 'Alchemist',
      desc: "You gain proficiency with alchemist's supplies. If you already have it, gain proficiency with one other type of artisan's tools of your choice.",
    },
    {
      id: 'alch-spells', name: 'Alchemist Spells', level: 3,
      source: 'Alchemist',
      desc: "Always-prepared spells (they don't count against your prepared spells, and count as artificer spells): 3rd Healing Word, Ray of Sickness · 5th Flaming Sphere, Melf's Acid Arrow · 9th Gaseous Form, Mass Healing Word · 13th Blight, Death Ward · 17th Cloudkill, Raise Dead. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'alch-elixir', name: 'Experimental Elixir', level: 3,
      source: 'Alchemist', combat: true,
      desc: "After a long rest, with alchemist's supplies on you, brew an experimental elixir in an empty flask — roll on the d6 table (Healing, Swiftness, Resilience, Boldness, Flight, Transformation) or, when made by expending a 1st-level-or-higher slot as an action, choose the effect. Brew more per rest as you level: two at 6th, three at 15th (each needs its own flask). Elixirs last until drunk or your next long rest. Drinking or administering one is an action. Brew, roll, and drink them on the Combat tab.",
    },
    {
      id: 'alch-savant', name: 'Alchemical Savant', level: 5,
      source: 'Alchemist', combat: true,
      desc: "When you cast a spell using alchemist's supplies as your focus, add your INT modifier (min +1) to one roll of that spell that restores hit points or deals acid, fire, necrotic, or poison damage.",
    },
    {
      id: 'alch-reagents', name: 'Restorative Reagents', level: 9,
      source: 'Alchemist', combat: true,
      desc: "Whenever a creature drinks one of your experimental elixirs, it also gains 2d6 + your INT modifier temporary hit points (min 1). You can also cast Lesser Restoration without a slot or preparation using alchemist's supplies as the focus, a number of times equal to your INT modifier (min once) per long rest.",
    },
    {
      id: 'alch-mastery', name: 'Chemical Mastery', level: 15,
      source: 'Alchemist', combat: true,
      desc: "You gain resistance to acid and poison damage and immunity to the poisoned condition. You can also cast Greater Restoration and Heal without a slot, preparation, or material component using alchemist's supplies as the focus — each once per long rest.",
    },
  ],
};
