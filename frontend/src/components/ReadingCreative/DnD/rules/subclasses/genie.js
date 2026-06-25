/**
 * The Genie — Warlock. A pact with a noble genie of one of the four elemental
 * kinds (dao, djinni, efreeti, marid). The kind colors everything: expanded
 * spells, the Genie's Wrath damage type, and the resistance of Elemental Gift.
 * Pick the kind on the GenieBlock, which also tracks the Genie's Vessel, the
 * Elemental Gift flight, and Limited Wish.
 */
export default {
  name: 'The Genie',
  className: 'Warlock',
  features: [
    {
      id: 'genie-kind', name: "Genie's Kind", level: 1,
      source: 'The Genie',
      desc: "Choose your patron's kind, which sets your element and damage type: Dao (earth · bludgeoning), Djinni (air · thunder), Efreeti (fire · fire), or Marid (water · cold). Pick the kind on the Combat tab — it determines your expanded spells, Genie's Wrath, and Elemental Gift.",
    },
    {
      id: 'genie-spells', name: 'Genie Expanded Spells', level: 1,
      source: 'The Genie',
      desc: "Added to your warlock spell list — general genie spells: 1st Detect Evil and Good · 2nd Phantasmal Force · 3rd Create Food and Water · 4th Phantasmal Killer · 5th Creation · 9th Wish. Plus your kind's spells — Dao: Sanctuary, Spike Growth, Meld into Stone, Stone Shape, Wall of Stone · Djinni: Thunderwave, Gust of Wind, Wind Wall, Greater Invisibility, Seeming · Efreeti: Burning Hands, Scorching Ray, Fireball, Fire Shield, Flame Strike · Marid: Fog Cloud, Blur, Sleet Storm, Control Water, Cone of Cold. Learn them as warlock spells on the Spells tab.",
    },
    {
      id: 'genie-vessel', name: "Genie's Vessel", level: 1,
      source: 'The Genie', combat: true,
      desc: "Your patron gifts a Tiny vessel (a spellcasting focus). Genie's Wrath: once per turn when you hit with an attack, deal extra damage equal to your proficiency bonus, of your kind's type. Bottled Respite: action — vanish into the vessel's extradimensional space for up to twice your proficiency bonus in hours; once per long rest. The vessel's AC equals your spell save DC, its HP equal your warlock level + proficiency bonus, and it is immune to poison and psychic damage. Track it on the Combat tab.",
    },
    {
      id: 'genie-elemental-gift', name: 'Elemental Gift', level: 6,
      source: 'The Genie', combat: true,
      desc: "You gain resistance to your kind's damage type. As a bonus action, you can give yourself a flying speed of 30 ft (with hover) for 10 minutes, a number of times equal to your proficiency bonus, regaining all uses on a long rest. Track flight on the Combat tab.",
    },
    {
      id: 'genie-sanctuary', name: 'Sanctuary Vessel', level: 10,
      source: 'The Genie', combat: true,
      desc: 'When you enter your vessel via Bottled Respite, you can draw up to five willing creatures within 30 ft in with you. As a bonus action you can eject any number of them. Anyone who remains inside for at least 10 minutes gains the benefit of a short rest, and can add your proficiency bonus to the HP they regain from spending Hit Dice there.',
    },
    {
      id: 'genie-limited-wish', name: 'Limited Wish', level: 14,
      source: 'The Genie', combat: true,
      desc: 'Action: speak your desire to your vessel to gain the effect of one spell of 6th level or lower with a casting time of 1 action, from any class\'s spell list — no components or requirements needed. Once you use this, you can\'t use it again until you finish 1d4 long rests. Track it on the Combat tab.',
    },
  ],
};
