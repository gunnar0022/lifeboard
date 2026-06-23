export default {
  name: 'Path of the Storm Herald',
  className: 'Barbarian',
  features: [
    { id: 'storm-aura', name: 'Storm Aura', level: 3, source: 'Path of the Storm Herald', combat: true,
      desc: 'While raging you emanate a 10-foot stormy aura (not through total cover). It activates when you enter your rage and again as a bonus action on each of your turns. Choose Desert, Sea, or Tundra (changeable when you gain a level in this class); save DC = 8 + your proficiency bonus + your Constitution modifier. Desert: each other creature in the aura takes fire damage (2, rising to 3/4/5/6 at levels 5/10/15/20). Sea: one creature you can see in the aura makes a Dexterity save, taking lightning damage on a failure and half on a success (1d6, rising to 2d6/3d6/4d6 at levels 10/15/20). Tundra: each creature of your choice in the aura gains temporary hit points (2, rising to 3/4/5/6 at levels 5/10/15/20).' },
    { id: 'storm-soul', name: 'Storm Soul', level: 6, source: 'Path of the Storm Herald', combat: true,
      desc: 'You gain a benefit even when your aura is inactive, based on your environment. Desert: resistance to fire damage, immunity to the effects of extreme heat, and you can set unattended flammable objects alight with a touch (action). Sea: resistance to lightning damage, you can breathe underwater, and you gain a swimming speed of 30 feet. Tundra: resistance to cold damage, immunity to the effects of extreme cold, and as an action you can freeze a 5-foot cube of water for 1 minute (fails if a creature is in it).' },
    { id: 'storm-shielding', name: 'Shielding Storm', level: 10, source: 'Path of the Storm Herald', combat: true,
      desc: 'Each creature of your choice has the damage resistance you gained from Storm Soul while it is within your Storm Aura.' },
    { id: 'storm-raging', name: 'Raging Storm', level: 14, source: 'Path of the Storm Herald', combat: true,
      desc: 'Your storm lashes out, based on your environment. Desert: when a creature in your aura hits you with an attack, you can use your reaction to force a Dexterity save; on a failure it takes fire damage equal to half your barbarian level. Sea: when you hit a creature in your aura, you can use your reaction to force a Strength save; on a failure it is knocked prone. Tundra: whenever your Storm Aura activates, one creature you can see in the aura must succeed on a Strength save or have its speed reduced to 0 until the start of your next turn.' },
  ],
};
