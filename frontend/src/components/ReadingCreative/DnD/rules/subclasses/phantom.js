export default {
  name: 'Phantom',
  className: 'Rogue',
  features: [
    { id: 'phan-whispers', name: 'Whispers of the Dead', level: 3, source: 'Phantom', combat: true,
      desc: 'Whenever you finish a short or long rest, a ghostly presence grants you one skill or tool proficiency of your choice. You lose it when you use this feature to choose a different proficiency you lack.' },
    { id: 'phan-wails', name: 'Wails from the Grave', level: 3, source: 'Phantom', combat: true,
      desc: 'Immediately after you deal Sneak Attack damage to a creature on your turn, you can target a second creature within 30 feet of the first. Roll half the number of your Sneak Attack dice (round up); the second creature takes that much necrotic damage. You can use this a number of times equal to your proficiency bonus, regaining all uses on a long rest.' },
    { id: 'phan-tokens', name: 'Tokens of the Departed', level: 9, source: 'Phantom', combat: true,
      desc: 'As a reaction when a creature you can see dies within 30 feet, you can create a Tiny soul trinket in your free hand. You can hold up to your proficiency bonus in soul trinkets. While you carry one, you have advantage on death saving throws and Constitution saving throws. When you deal Sneak Attack damage, you can destroy a trinket to use Wails from the Grave without expending a use. As an action, you can destroy a trinket (anywhere) to ask its spirit one question.' },
    { id: 'phan-ghostwalk', name: 'Ghost Walk', level: 13, source: 'Phantom', combat: true,
      desc: 'As a bonus action, assume a spectral form for 10 minutes (or until you end it): flying speed 10 feet, you can hover, attack rolls against you have disadvantage, and you can move through creatures and objects as difficult terrain (1d10 force damage if you end your turn inside one). To use it again, finish a long rest or destroy a soul trinket as part of the activating bonus action.' },
    { id: 'phan-deaths-friend', name: "Death's Friend", level: 17, source: 'Phantom', combat: true,
      desc: 'When you use Wails from the Grave, you can deal the necrotic damage to both the first and the second creature. Also, at the end of a long rest, a soul trinket appears in your hand if you have none.' },
  ],
};
