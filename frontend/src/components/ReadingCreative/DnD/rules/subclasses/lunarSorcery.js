/**
 * Lunar Sorcery — Sorcerer (Dragonlance). Magic tied to a chosen lunar phase —
 * Full, New, or Crescent Moon — which colors your bonus spells, Metamagic
 * discounts, defensive boons, and a capstone burst. The chosen phase drives the
 * whole LunarSorceryBlock UI.
 */
export default {
  name: 'Lunar Sorcery',
  className: 'Sorcerer',
  features: [
    {
      id: 'lunar-embodiment', name: 'Lunar Embodiment', level: 1,
      source: 'Lunar Sorcery', combat: true,
      desc: "You learn Lunar Spells (added to your sorcerer list, not counting against spells known). On each long rest, choose a phase — Full Moon, New Moon, or Crescent Moon — and you can cast one 1st-level spell of that phase once without a slot. Full: Shield, Lesser Restoration, Dispel Magic, Death Ward, Rary's Telepathic Bond. New: Ray of Sickness, Blindness/Deafness, Vampiric Touch, Confusion, Hold Monster. Crescent: Color Spray, Alter Self, Phantom Steed, Hallucinatory Terrain, Mislead. Choose your phase on the Combat tab.",
    },
    {
      id: 'lunar-moonfire', name: 'Moon Fire', level: 1,
      source: 'Lunar Sorcery', combat: true,
      desc: "You learn the Sacred Flame cantrip (it doesn't count against your cantrips known). When you cast it, you can target one creature as normal or two creatures within 5 ft of each other.",
    },
    {
      id: 'lunar-boons', name: 'Lunar Boons', level: 6,
      source: 'Lunar Sorcery', combat: true,
      desc: 'When you use Metamagic on a spell from a school tied to your current phase, you can reduce the sorcery points spent by 1 (min 0). Schools — Full: Abjuration & Divination · New: Enchantment & Necromancy · Crescent: Illusion & Transmutation. Usable a number of times equal to your proficiency bonus, regained on a long rest. Track the discount uses on the Combat tab.',
    },
    {
      id: 'lunar-waxing', name: 'Waxing and Waning', level: 6,
      source: 'Lunar Sorcery', combat: true,
      desc: 'Bonus action: spend 1 sorcery point to change your current phase. You can also cast one 1st-level spell from each lunar phase once without a slot (while in that phase), regaining these casts on a long rest. Switch phases on the Combat tab.',
    },
    {
      id: 'lunar-empowerment', name: 'Lunar Empowerment', level: 14,
      source: 'Lunar Sorcery', combat: true,
      desc: 'While in a phase, gain its benefit. Full: bonus action to shed/douse bright light (10 ft) + advantage on Investigation/Perception in it (you and chosen allies). New: advantage on Stealth; while fully in darkness, attacks against you have disadvantage. Crescent: resistance to necrotic and radiant damage.',
    },
    {
      id: 'lunar-phenomenon', name: 'Lunar Phenomenon', level: 18,
      source: 'Lunar Sorcery', combat: true,
      desc: "Bonus action (or as part of changing phase): unleash your current phase's power. Full: creatures within 30 ft make a CON save or are blinded, and one regains 3d8 HP. New: creatures within 30 ft make a DEX save or take 3d10 necrotic and have speed 0, and you turn invisible. Crescent: teleport up to 60 ft (bring one willing ally within 5 ft) and you both gain resistance to all damage until your next turn. Once per long rest per use, or spend 5 sorcery points to use again. Activate on the Combat tab.",
    },
  ],
};
