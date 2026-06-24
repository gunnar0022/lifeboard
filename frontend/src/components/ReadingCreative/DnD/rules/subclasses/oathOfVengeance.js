/**
 * Oath of Vengeance — the dark avenger. Flavor on the Features tab; the Combat-
 * tab VengeanceBlock surfaces the two Channel Divinity options (Vow of Enmity,
 * Abjure Enemy), the relentless-pursuit / counterstrike reminders, and the
 * trackable Avenging Angel capstone.
 */
export default {
  name: 'Oath of Vengeance',
  className: 'Paladin',
  features: [
    {
      id: 'ven-tenets', name: 'Tenets of Vengeance', level: 3,
      source: 'Oath of Vengeance', noTruncate: true,
      desc: 'Punish wrongdoers by any means necessary — even at the cost of your own righteousness. • Fight the Greater Evil: faced with a choice, fight the greater evil. • No Mercy for the Wicked: ordinary foes might win mercy; sworn enemies do not. • By Any Means Necessary: your qualms can\'t stop you from exterminating your foes. • Restitution: help those harmed by the foes you failed to stop.',
    },
    {
      id: 'ven-spells', name: 'Oath of Vengeance Spells', level: 3,
      source: 'Oath of Vengeance',
      desc: "Always-prepared oath spells (they don't count against your prepared spells): 3rd Bane, Hunter's Mark · 5th Hold Person, Misty Step · 9th Haste, Protection from Energy · 13th Banishment, Dimension Door · 17th Hold Monster, Scrying. Pin them as Always Prepared on the Spells tab.",
    },
    {
      id: 'ven-cd', name: 'Channel Divinity', level: 3,
      source: 'Oath of Vengeance', noTruncate: true,
      desc: 'Two options (spend a Channel Divinity use; see the Combat tab). • Abjure Enemy: action — a creature within 60 ft. makes a WIS save (fiends/undead at disadvantage); on a failure it\'s frightened with speed 0 for 1 min (or until it takes damage); on a success its speed is halved. • Vow of Enmity: bonus action — gain advantage on attacks against a creature within 10 ft. for 1 min (or until it drops/falls unconscious).',
    },
    {
      id: 'ven-relentless', name: 'Relentless Avenger', level: 7,
      source: 'Oath of Vengeance', combat: true,
      desc: "When you hit a creature with an opportunity attack, you can move up to half your speed immediately (part of the same reaction). This movement doesn't provoke opportunity attacks.",
    },
    {
      id: 'ven-soul', name: 'Soul of Vengeance', level: 15,
      source: 'Oath of Vengeance', combat: true,
      desc: 'When a creature under your Vow of Enmity makes an attack, you can use your reaction to make a melee weapon attack against it if it is within range.',
    },
    {
      id: 'ven-angel', name: 'Avenging Angel', level: 20,
      source: 'Oath of Vengeance', combat: true,
      desc: 'Action: for 1 hour, sprout wings (fly speed 60 ft.) and emanate a 30-ft. aura of menace — the first time an enemy enters it or starts its turn there in a battle, it makes a WIS save or is frightened for 1 min (or until it takes damage); attacks against the frightened creature have advantage. Once per long rest.',
    },
  ],
};
