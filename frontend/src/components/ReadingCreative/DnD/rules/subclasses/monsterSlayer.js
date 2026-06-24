/**
 * Monster Slayer — Ranger subclass. Built around a designated quarry. The
 * Combat-tab block makes the quarry the centerpiece (an editable target that
 * lights up its linked benefits — Slayer's Prey damage, Supernatural Defense,
 * Slayer's Counter) and tracks Hunter's Sense (WIS / long) and Magic-User's
 * Nemesis (1 / short). Spells are pinned on the Spells tab.
 */
export default {
  name: 'Monster Slayer',
  className: 'Ranger',
  features: [
    {
      id: 'ms-magic', name: 'Monster Slayer Magic', level: 3,
      source: 'Monster Slayer',
      desc: "You learn an additional always-prepared ranger spell at certain levels (it doesn't count against your spells known): 3rd Protection from Evil and Good · 5th Zone of Truth · 9th Magic Circle · 13th Banishment · 17th Hold Monster. Pin these as Always Prepared on the Spells tab.",
    },
    {
      id: 'ms-sense', name: "Hunter's Sense", level: 3,
      source: 'Monster Slayer', combat: true,
      desc: 'As an action, choose a creature within 60 ft. and learn its damage immunities, resistances, and vulnerabilities (or that it has none). Uses equal to your Wisdom modifier (min 1); regain all on a long rest.',
    },
    {
      id: 'ms-prey', name: "Slayer's Prey", level: 3,
      source: 'Monster Slayer', combat: true,
      desc: 'As a bonus action, designate one creature within 60 ft. as your quarry. The first time each turn you hit it with a weapon attack, it takes an extra 1d6 weapon damage. Lasts until you finish a short or long rest or designate a different creature.',
    },
    {
      id: 'ms-defense', name: 'Supernatural Defense', level: 7,
      source: 'Monster Slayer', combat: true,
      desc: 'Whenever your Slayer\'s Prey quarry forces you to make a saving throw, and whenever you make an ability check to escape its grapple, add 1d6 to your roll.',
    },
    {
      id: 'ms-nemesis', name: "Magic-User's Nemesis", level: 11,
      source: 'Monster Slayer', combat: true,
      desc: 'When you see a creature casting a spell or teleporting within 60 ft., you can use your reaction to force it to make a Wisdom save vs. your spell save DC, or its spell/teleport fails and is wasted. Once per short or long rest.',
    },
    {
      id: 'ms-counter', name: "Slayer's Counter", level: 15,
      source: 'Monster Slayer', combat: true,
      desc: "If your Slayer's Prey quarry forces you to make a saving throw, you can use your reaction to make one weapon attack against it (immediately, before the save). If the attack hits, your save automatically succeeds, in addition to the attack's normal effects.",
    },
  ],
};
