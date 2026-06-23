export default {
  name: 'Path of the Totem Warrior',
  className: 'Barbarian',
  features: [
    { id: 'totem-seeker', name: 'Spirit Seeker', level: 3, source: 'Path of the Totem Warrior',
      desc: 'Your path seeks attunement with the natural world. You can cast the Beast Sense and Speak with Animals spells, but only as rituals.' },
    { id: 'totem-spirit', name: 'Totem Spirit', level: 3, source: 'Path of the Totem Warrior', combat: true,
      desc: 'You choose a totem spirit and gain its feature (and acquire a physical totem object). Bear: while raging you have resistance to all damage except psychic. Eagle: while raging and not in heavy armor, others have disadvantage on opportunity attacks against you and you can Dash as a bonus action. Elk: while raging and not in heavy armor, your walking speed increases by 15 feet. Tiger: while raging you add 10 feet to your long jump and 3 feet to your high jump. Wolf: while raging, your allies have advantage on melee attacks against hostile creatures within 5 feet of you.' },
    { id: 'totem-aspect', name: 'Aspect of the Beast', level: 6, source: 'Path of the Totem Warrior',
      desc: 'You gain a magical benefit based on a totem animal (same or different). Bear: carrying capacity doubled and advantage on Strength checks to push, pull, lift, or break. Eagle: see up to a mile in fine detail and dim light doesn\'t hinder your Perception. Elk: your travel pace (and up to ten companions within 60 feet) is doubled. Tiger: proficiency in two of Athletics, Acrobatics, Stealth, Survival. Wolf: track at a fast pace and move stealthily at a normal pace.' },
    { id: 'totem-walker', name: 'Spirit Walker', level: 10, source: 'Path of the Totem Warrior',
      desc: 'You can cast Commune with Nature as a ritual; a spiritual version of one of your chosen totem animals appears to convey the information.' },
    { id: 'totem-attunement', name: 'Totemic Attunement', level: 14, source: 'Path of the Totem Warrior', combat: true,
      desc: 'You gain a magical benefit based on a totem animal (same or different). Bear: while raging, hostile creatures within 5 feet have disadvantage on attacks against targets other than you (unless they can\'t see/hear you or can\'t be frightened). Eagle: while raging you have a flying speed equal to your walking speed (you fall if you end your turn aloft). Elk: while raging, a bonus action during your move lets you pass through a Large or smaller creature\'s space; it makes a Strength save (DC 8 + your Strength modifier + your proficiency bonus) or is knocked prone and takes 1d12 + your Strength modifier bludgeoning. Tiger: while raging, if you move at least 20 feet straight toward a Large or smaller target before a melee attack, you can make one extra melee attack as a bonus action. Wolf: while raging, a bonus action knocks a Large or smaller creature prone when you hit it with a melee attack.' },
  ],
};
