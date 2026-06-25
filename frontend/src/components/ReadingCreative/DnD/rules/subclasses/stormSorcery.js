/**
 * Storm Sorcery — Sorcerer. Magic infused with elemental air; the sorcerer flits
 * on gusts, erupts with storm energy when casting, and lashes back at attackers.
 * Combat hooks: Heart of the Storm's eruption, Storm's Fury's reaction, and the
 * Wind Soul flight grant — surfaced on the StormSorceryBlock.
 */
export default {
  name: 'Storm Sorcery',
  className: 'Sorcerer',
  features: [
    {
      id: 'storm-windspeaker', name: 'Wind Speaker', level: 1,
      source: 'Storm Sorcery',
      desc: 'You can speak, read, and write Primordial and its dialects: Aquan, Auran, Ignan, and Terran.',
    },
    {
      id: 'storm-tempestuous', name: 'Tempestuous Magic', level: 1,
      source: 'Storm Sorcery', combat: true,
      desc: 'Bonus action immediately before or after you cast a spell of 1st level or higher: whirling air lets you fly up to 10 ft without provoking opportunity attacks.',
    },
    {
      id: 'storm-heart', name: 'Heart of the Storm', level: 6,
      source: 'Storm Sorcery', combat: true,
      desc: 'You gain resistance to lightning and thunder damage. When you start casting a spell of 1st level or higher that deals lightning or thunder damage, creatures of your choice within 10 ft take lightning or thunder damage (your choice) equal to half your sorcerer level.',
    },
    {
      id: 'storm-guide', name: 'Storm Guide', level: 6,
      source: 'Storm Sorcery', combat: true,
      desc: 'You can subtly control nearby weather: if it is raining, an action stops the rain in a 20-ft-radius sphere around you (end as a bonus action); if it is windy, a bonus action each round sets the wind direction in a 100-ft-radius sphere until the end of your next turn.',
    },
    {
      id: 'storm-fury', name: "Storm's Fury", level: 14,
      source: 'Storm Sorcery', combat: true,
      desc: 'When you are hit by a melee attack, you can use your reaction to deal lightning damage to the attacker equal to your sorcerer level. The attacker must also succeed on a Strength saving throw against your spell save DC or be pushed up to 20 ft away from you.',
    },
    {
      id: 'storm-windsoul', name: 'Wind Soul', level: 18,
      source: 'Storm Sorcery', combat: true,
      desc: 'You gain immunity to lightning and thunder damage and a magical flying speed of 60 ft. As an action, you can reduce your flying speed to 30 ft for 1 hour and give a flying speed of 30 ft (for 1 hour) to a number of creatures within 30 ft equal to 3 + your Charisma modifier. Once you share flight this way, you can\'t again until you finish a short or long rest.',
    },
  ],
};
