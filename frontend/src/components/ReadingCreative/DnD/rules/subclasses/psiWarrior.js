export default {
  name: 'Psi Warrior',
  className: 'Fighter',
  features: [
    { id: 'psi-power', name: 'Psionic Power', level: 3, source: 'Psi Warrior', combat: true,
      desc: 'You have Psionic Energy dice (d6s) equal to twice your proficiency bonus, regaining all of them on a long rest; as a bonus action you can regain one expended die (once per short or long rest). The die grows at 5th (d8), 11th (d10), and 17th (d12). Powers: Protective Field (reaction, expend a die to reduce damage to a creature within 30 ft by the roll + your INT mod, min 1); Psionic Strike (once per turn after a weapon hit within 30 ft, expend a die to deal force damage = the roll + your INT mod); Telekinetic Movement (action: move a Large-or-smaller object or willing creature up to 30 ft — once per short/long rest, or expend a die to repeat).' },
    { id: 'psi-adept', name: 'Telekinetic Adept', level: 7, source: 'Psi Warrior', combat: true,
      desc: 'Psi-Powered Leap (bonus action: flying speed equal to twice your walking speed until end of turn — once per short/long rest, or expend a die to repeat). Telekinetic Thrust (when you deal Psionic Strike damage, force a Strength save vs DC 8 + your proficiency bonus + your INT mod or be knocked prone or moved 10 feet).' },
    { id: 'psi-guarded', name: 'Guarded Mind', level: 10, source: 'Psi Warrior', combat: true,
      desc: 'You have resistance to psychic damage. If you start your turn charmed or frightened, you can expend a Psionic Energy die to end every effect on you causing those conditions.' },
    { id: 'psi-bulwark', name: 'Bulwark of Force', level: 15, source: 'Psi Warrior', combat: true,
      desc: 'As a bonus action, choose creatures (including you) within 30 feet up to your INT mod (minimum one); each gains half cover for 1 minute or until you\'re incapacitated. Once per long rest, or expend a die to repeat.' },
    { id: 'psi-master', name: 'Telekinetic Master', level: 18, source: 'Psi Warrior', combat: true,
      desc: 'You can cast Telekinesis without components (Intelligence is your spellcasting ability), and on each turn you concentrate on it you can make one weapon attack as a bonus action. Once per long rest, or expend a die to cast it again.' },
  ],
};
