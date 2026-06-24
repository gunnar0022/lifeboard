/**
 * Companion stat-block builders — the React-free data layer shared by the
 * Beast Master (Primal Companion) and Drakewarden (Drake Companion) Combat-tab
 * cards AND the Features-tab stat-block viewer. Each builder takes a context of
 * derived character numbers and returns a normalized block the presentational
 * CompanionStatBlock knows how to render:
 *
 *   ctx = { level, pb, spellAtk, spellDC, wisMod }
 *
 *   block = {
 *     name, size, type, ac, hpMax, hitDie, hitDiceCount, speed,
 *     abilities: {STR,DEX,CON,INT,WIS,CHA}, senses, languages,
 *     saves, immunities,                         // strings or null
 *     traits:    [{ name, desc }],
 *     actions:   [{ name, toHit, damage, desc }],
 *     reactions: [{ name, desc }],
 *   }
 *
 * The companion's bonuses scale entirely with the ranger — proficiency bonus,
 * spell attack modifier, and spell save DC — so a single builder stays correct
 * at every level.
 */

const fmt = (n) => (n >= 0 ? `+${n}` : `${n}`);

// ── Beast Master — Primal Companion ──────────────────────────────────────────
export const PRIMAL_VARIANTS = [
  { id: 'land', label: 'Beast of the Land' },
  { id: 'sea', label: 'Beast of the Sea' },
  { id: 'sky', label: 'Beast of the Sky' },
];

const PRIMAL_BOND = {
  name: 'Primal Bond',
  desc: 'You can add your proficiency bonus to any ability check or saving throw the beast makes.',
};

export function buildPrimalBeast(variant, ctx) {
  const { level, pb, spellAtk, spellDC } = ctx;
  const hit = fmt(spellAtk);
  const common = {
    type: 'beast',
    senses: 'darkvision 60 ft., passive Perception 12',
    languages: 'understands the languages you speak',
  };

  if (variant === 'sea') {
    return {
      ...common,
      name: 'Beast of the Sea',
      size: 'Medium',
      ac: 13 + pb,
      hpMax: 5 + 5 * level, hitDie: 'd8', hitDiceCount: level,
      speed: '5 ft., swim 60 ft.',
      abilities: { STR: 14, DEX: 14, CON: 15, INT: 8, WIS: 14, CHA: 11 },
      traits: [
        { name: 'Amphibious', desc: 'The beast can breathe both air and water.' },
        PRIMAL_BOND,
      ],
      actions: [{
        name: 'Binding Strike', toHit: hit,
        damage: `1d6 + ${2 + pb} piercing or bludgeoning`,
        desc: `The target is grappled (escape DC ${spellDC}). Until the grapple ends, the beast can't use this attack on another target.`,
      }],
      reactions: [],
    };
  }

  if (variant === 'sky') {
    return {
      ...common,
      name: 'Beast of the Sky',
      size: 'Small',
      ac: 13 + pb,
      hpMax: 4 + 4 * level, hitDie: 'd6', hitDiceCount: level,
      speed: '10 ft., fly 60 ft.',
      abilities: { STR: 6, DEX: 16, CON: 13, INT: 8, WIS: 14, CHA: 11 },
      traits: [
        { name: 'Flyby', desc: "The beast doesn't provoke opportunity attacks when it flies out of an enemy's reach." },
        PRIMAL_BOND,
      ],
      actions: [{
        name: 'Shred', toHit: hit, damage: `1d4 + ${3 + pb} slashing`,
        desc: 'Melee weapon attack, reach 5 ft., one target.',
      }],
      reactions: [],
    };
  }

  // Default: Beast of the Land
  return {
    ...common,
    name: 'Beast of the Land',
    size: 'Medium',
    ac: 13 + pb,
    hpMax: 5 + 5 * level, hitDie: 'd8', hitDiceCount: level,
    speed: '40 ft., climb 40 ft.',
    abilities: { STR: 14, DEX: 14, CON: 15, INT: 8, WIS: 14, CHA: 11 },
    traits: [
      { name: 'Charge', desc: `If the beast moves 20+ ft. straight toward a target then hits it with a Maul on the same turn, the target takes an extra 1d6 slashing and, if a creature, must succeed on a STR save (DC ${spellDC}) or be knocked prone.` },
      PRIMAL_BOND,
    ],
    actions: [{
      name: 'Maul', toHit: hit, damage: `1d8 + ${2 + pb} slashing`,
      desc: 'Melee weapon attack, reach 5 ft., one target.',
    }],
    reactions: [],
  };
}

// ── Drakewarden — Drake Companion ────────────────────────────────────────────
export const DRAKE_ESSENCES = ['acid', 'cold', 'fire', 'lightning', 'poison'];

export function buildDrake(essence, ctx) {
  const { level, pb } = ctx;
  const ess = essence || 'fire';
  const size = level >= 15 ? 'Large' : level >= 7 ? 'Medium' : 'Small';
  // Magic Fang (7th) adds 1d6; Empowered Bite (15th) brings it to 2d6 total.
  const bonusDice = level >= 15 ? `2d6 ${ess}` : level >= 7 ? `1d6 ${ess}` : null;
  const biteDamage = `1d6 + ${pb} piercing${bonusDice ? ` + ${bonusDice}` : ''}`;

  return {
    name: 'Drake Companion',
    size,
    type: 'dragon',
    ac: 14 + pb,
    hpMax: 5 + 5 * level, hitDie: 'd10', hitDiceCount: level,
    speed: level >= 7 ? '40 ft., fly 40 ft.' : '40 ft.',
    abilities: { STR: 16, DEX: 12, CON: 15, INT: 8, WIS: 14, CHA: 8 },
    senses: 'darkvision 60 ft., passive Perception 12',
    languages: 'Draconic',
    saves: `Dex ${fmt(1 + pb)}, Wis ${fmt(2 + pb)}`,
    immunities: `${ess} (Draconic Essence)`,
    traits: [{
      name: 'Draconic Essence',
      desc: `Damage immunity and Infused Strikes damage are ${ess} (chosen when summoned: acid, cold, fire, lightning, or poison).`,
    }],
    actions: [{
      name: 'Bite', toHit: fmt(3 + pb), damage: biteDamage,
      desc: 'Melee weapon attack, reach 5 ft., one target.',
    }],
    reactions: [{
      name: 'Infused Strikes',
      desc: `When another creature within 30 ft. that the drake can see hits a target with a weapon attack, the target takes an extra 1d6 ${ess} damage.`,
    }],
  };
}

// ── Battle Smith — Steel Defender ────────────────────────────────────────────
// Scales with artificer level + INT (its attack is your spell attack modifier).
// `improved` is the 15th-level Improved Defender upgrade (+2 AC, Deflect kicks
// back force damage).
export function buildSteelDefender(ctx) {
  const { level, pb, spellAtk, intMod, improved } = ctx;
  const perc2 = 10 + pb * 2;
  return {
    name: 'Steel Defender',
    size: 'Medium',
    type: 'construct',
    ac: 15 + (improved ? 2 : 0),
    hpMax: Math.max(1, 2 + intMod + 5 * level), hitDie: 'd8', hitDiceCount: level,
    speed: '40 ft.',
    abilities: { STR: 14, DEX: 12, CON: 14, INT: 4, WIS: 10, CHA: 6 },
    senses: `darkvision 60 ft., passive Perception ${perc2}`,
    saves: `Dex ${fmt(1 + pb)}, Con ${fmt(2 + pb)}`,
    immunities: 'poison · charmed, exhaustion, poisoned',
    traits: [
      { name: 'Vigilant', desc: "The defender can't be surprised." },
      { name: 'Skills', desc: `Athletics ${fmt(2 + pb)}, Perception ${fmt(pb * 2)}. Understands the languages you speak.` },
    ],
    actions: [
      {
        name: 'Force-Empowered Rend', toHit: fmt(spellAtk),
        damage: `1d8 + ${pb} force`,
        desc: 'Melee weapon attack, reach 5 ft., one target you can see.',
      },
      {
        name: 'Repair (3/Day)', toHit: null, damage: `2d8 + ${pb} HP`,
        desc: 'Restore hit points to itself or one construct or object within 5 ft.',
      },
    ],
    reactions: [{
      name: 'Deflect Attack',
      desc: `Impose disadvantage on an attack (within 5 ft.) aimed at a creature other than itself.${improved ? ` The attacker then takes ${1}d4 + ${intMod} force damage.` : ''}`,
    }],
  };
}

// ── Artillerist — Eldritch Cannon ────────────────────────────────────────────
// Not a creature card (it has no real ability scores), so this returns the
// lighter shape the ArtilleristBlock's CannonCard renders. Damage gains +1d8 at
// 9th level (Explosive Cannon).
export const CANNON_TYPES = [
  { id: 'flamethrower', label: 'Flamethrower' },
  { id: 'ballista', label: 'Force Ballista' },
  { id: 'protector', label: 'Protector' },
];

export function buildCannon(type, ctx) {
  const { level, intMod, spellDC } = ctx;
  const t = type || 'flamethrower';
  const dmgDie = level >= 9 ? '3d8' : '2d8';
  const protDie = level >= 9 ? '2d8' : '1d8';
  const ac = 18;
  const hpMax = Math.max(1, 5 * level);

  const ACTIVATION = {
    flamethrower: {
      label: 'Flamethrower',
      action: `15-ft cone — each creature makes a DEX save (DC ${spellDC}), taking ${dmgDie} fire (half on success). Ignites flammable objects.`,
    },
    ballista: {
      label: 'Force Ballista',
      action: `Ranged spell attack from the cannon at one target within 120 ft. Hit: ${dmgDie} force, and a creature is pushed up to 5 ft. away.`,
    },
    protector: {
      label: 'Protector',
      action: `Burst of positive energy: it and each chosen creature within 10 ft. gain ${protDie} + ${intMod} temp HP (min 1).`,
    },
  };

  return { type: t, ac, hpMax, ...ACTIVATION[t] };
}

