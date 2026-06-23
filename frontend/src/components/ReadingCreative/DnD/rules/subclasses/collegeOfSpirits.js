export default {
  name: 'College of Spirits',
  className: 'Bard',
  features: [
    { id: 'spir-guiding', name: 'Guiding Whispers', level: 3, source: 'College of Spirits',
      desc: 'You learn the Guidance cantrip, which doesn\'t count against your bard cantrips known. For you it has a range of 60 feet.' },
    { id: 'spir-focus', name: 'Spiritual Focus', level: 3, source: 'College of Spirits', combat: true,
      desc: 'You can use a candle, crystal ball, skull, spirit board, or tarokka deck as a spellcasting focus for your bard spells. Starting at 6th level, when you cast a bard spell that deals damage or restores hit points through your Spiritual Focus, roll a d6 and add it as a bonus to one damage or healing roll of that spell.' },
    { id: 'spir-tales', name: 'Tales from Beyond', level: 3, source: 'College of Spirits', combat: true,
      desc: 'While holding your Spiritual Focus, you can use a bonus action to expend one use of Bardic Inspiration and roll on the Spirit Tales table using your Bardic Inspiration die. You retain the tale until you bestow it or finish a short or long rest. As an action, target one creature you can see within 30 feet (including yourself) with the tale\'s effect; once bestowed you must roll again to use it. You can hold only one tale at a time, and rolling again immediately ends the previous tale. Saving throws use your spell save DC.' },
    { id: 'spir-session', name: 'Spirit Session', level: 6, source: 'College of Spirits', combat: true,
      desc: 'Over an hour-long ritual with your Spiritual Focus (during a short or long rest) with up to your proficiency bonus in willing creatures (including you), you temporarily learn one Divination or Necromancy spell from any class of a level no higher than the number of participants (and a level you can cast). It counts as a bard spell and doesn\'t count against your spells known. Once you do this you can\'t again until you start a long rest, and you know the spell until then.' },
    { id: 'spir-mystical', name: 'Mystical Connection', level: 14, source: 'College of Spirits', combat: true,
      desc: 'Whenever you roll on the Spirit Tales table, you can roll the die twice and choose which effect to bestow. If both dice show the same number, ignore it and choose any tale on the table.' },
  ],
};
