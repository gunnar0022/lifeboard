/**
 * Drakewarden — Ranger subclass. A summonable Drake Companion (its own stat
 * block, scaling with level/PB) plus a once-per-rest cone breath weapon and,
 * at high levels, shared resistances. The Combat-tab DrakewardenBlock owns the
 * drake card (essence picker, summon/recharge, HP), the breath-weapon tracker,
 * and the Reflexive Resistance pool; the Features tab shows the drake stat block
 * inline (statBlock: 'drake') so its numbers read cleanly.
 */
export default {
  name: 'Drakewarden',
  className: 'Ranger',
  features: [
    {
      id: 'dw-gift', name: 'Draconic Gift', level: 3,
      source: 'Drakewarden',
      desc: 'Your bond with dragonkind grants the Thaumaturgy cantrip (a ranger spell for you) and the ability to speak, read, and write Draconic or one other language of your choice. Pin Thaumaturgy as Always Prepared on the Spells tab.',
    },
    {
      id: 'dw-drake', name: 'Drake Companion', level: 3,
      source: 'Drakewarden', combat: true, statBlock: 'drake',
      desc: "As an action, summon your bound drake within 30 ft. and choose its Draconic Essence (acid, cold, fire, lightning, or poison) — setting its damage immunity and Infused Strikes type. It shares your initiative and takes its turn after yours, Dodging unless you spend a bonus action to command another action. Once summoned, you can't summon again until a long rest unless you expend a spell slot. Manage essence, summon, and HP in the Combat tab.",
    },
    {
      id: 'dw-bond', name: 'Bond of Fang and Scale', level: 7,
      source: 'Drakewarden', combat: true,
      desc: "Your summoned drake grows wings (fly speed = walking speed) and to Medium size, and can serve as your mount (Medium or smaller rider; it can't fly while you ride it). Its Bite deals +1d6 essence damage (Magic Fang), and you gain resistance to its essence damage type.",
    },
    {
      id: 'dw-breath', name: "Drake's Breath", level: 11,
      source: 'Drakewarden', combat: true,
      desc: "As an action, you or your drake exhale a 30-ft. cone. Choose acid, cold, fire, lightning, or poison (need not match the drake's essence); each creature in the cone makes a Dexterity save vs. your spell save DC, taking 8d6 (10d6 at 15th) damage, or half on a success. Once per long rest, or expend a 3rd-level+ slot to use again.",
    },
    {
      id: 'dw-perfected', name: 'Perfected Bond', level: 15,
      source: 'Drakewarden', combat: true,
      desc: "Your drake's Bite deals +2d6 essence damage total (Empowered Bite) and it grows to Large size (it may fly while you ride it). Reflexive Resistance: when you or the drake takes damage while within 30 ft. of each other, you can use your reaction to grant resistance to that instance — a number of times equal to your proficiency bonus per long rest.",
    },
  ],
};
