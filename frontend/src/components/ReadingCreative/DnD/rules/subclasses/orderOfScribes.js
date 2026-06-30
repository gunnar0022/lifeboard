export default {
  name: 'Order of Scribes',
  className: 'Wizard',
  features: [
    { id: 'scribe-quill', name: 'Wizardly Quill', level: 2, source: 'Order of Scribes', combat: true,
      desc: 'As a bonus action, create a Tiny magic quill in your free hand. It needs no ink (any color), copies spells into your spellbook in just 2 minutes per spell level, and can erase its own writing within 5 feet as a bonus action. It vanishes if you make another or die.' },
    { id: 'scribe-awakened', name: 'Awakened Spellbook', level: 2, source: 'Order of Scribes', combat: true,
      desc: 'Your spellbook is sentient. While holding it: use it as a spellcasting focus; when you cast a wizard spell with a slot, temporarily swap its damage type for one from another spell of that level in your book; and cast a ritual at its normal casting time (once per long rest). You can rebind it into a new book over a short rest. Track the damage-swap and ritual use on the Combat tab.' },
    { id: 'scribe-manifest-mind', name: 'Manifest Mind', level: 6, source: 'Order of Scribes', combat: true,
      desc: 'As a bonus action (book on your person), manifest the book\'s mind as a Tiny spectral object within 60 feet — intangible, shedding dim light 10 ft, with darkvision 60 ft and telepathy to you. You can cast a wizard spell as if from its space a number of times per day equal to your proficiency bonus. Move it 30 ft as a bonus action. It ends beyond 300 ft, on Dispel Magic, if the book is destroyed, if you die, or if dismissed. Once conjured, you can\'t do so again until a long rest unless you expend a spell slot. Track it on the Combat tab.' },
    { id: 'scribe-master-scrivener', name: 'Master Scrivener', level: 10, source: 'Order of Scribes', combat: true,
      desc: 'After a long rest you can scribe one magic scroll from your Awakened Spellbook — a 1st- or 2nd-level spell with a 1-action casting time, enhanced to count as one level higher. You cast it as an action; it vanishes when cast or at your next long rest. You also halve the gold and time to craft spell scrolls using your Wizardly Quill. Track the scroll on the Combat tab.' },
    { id: 'scribe-one-with-word', name: 'One with the Word', level: 14, source: 'Order of Scribes', combat: true,
      desc: 'While the book is on you, you have advantage on Intelligence (Arcana) checks. If you take damage while the mind is manifested, you can use your reaction to dismiss it and prevent all that damage, then roll 3d6 — the book temporarily loses spells of your choice whose combined levels meet or exceed the roll (if it can\'t cover the cost, you drop to 0 HP). You can\'t cast the lost spells until you finish 1d6 long rests. Once used, you can\'t do so again until a long rest. Track the gambit on the Combat tab.' },
  ],
};
