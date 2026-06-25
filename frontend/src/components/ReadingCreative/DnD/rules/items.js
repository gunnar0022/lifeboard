/**
 * Items / equipment rules — the single, React-free source of truth for turning
 * library items + per-character instances into attacks and AC.
 *
 * A "base" is a row from the dnd_items library (resolved via /items/batch into a
 * cache). An "instance" is the object stored on `character.items[]`; a
 * library-backed instance carries `refType:'item'` + `refId` plus per-instance
 * overrides (customName, magicBonus, charges, active, …). Legacy free-form items
 * have no refType and are left untouched by all of this.
 */

import { abilityMod, formatMod, proficiencyBonus } from '../dndUtils';

// ── Kinds & slots ────────────────────────────────────────────────────────────
export const ITEM_KINDS = [
  'melee', 'ranged', 'throwable', 'ammunition',
  'armor', 'shield', 'magic', 'consumable', 'gear',
];

export const KIND_LABELS = {
  melee: 'Melee Weapon', ranged: 'Ranged Weapon', throwable: 'Throwable',
  ammunition: 'Ammunition', armor: 'Armor', shield: 'Shield',
  magic: 'Magic Item', consumable: 'Consumable', gear: 'Gear',
};

// Kinds that occupy an equipment slot. Everything else lives in Carried.
export const EQUIPPABLE_KINDS = new Set(['melee', 'ranged', 'armor', 'shield', 'magic']);

// Kinds that produce an attack card on the Combat tab.
export const WEAPON_KINDS = new Set(['melee', 'ranged', 'throwable']);

export const EQUIP_SLOTS = [
  'main hand', 'off hand', 'body', 'head', 'hands', 'feet',
  'cloak', 'amulet', 'ring', 'focus', 'other',
];

export const WEAPON_PROPERTIES = [
  'light', 'finesse', 'thrown', 'two-handed', 'heavy', 'reach',
  'versatile', 'ammunition', 'loading', 'special',
];

/** A sensible default slot for a freshly-equipped item of this kind. */
export function defaultSlotForKind(kind) {
  switch (kind) {
    case 'armor': return 'body';
    case 'shield': return 'off hand';
    case 'melee':
    case 'ranged': return 'main hand';
    case 'magic': return 'other';
    default: return 'other';
  }
}

// ── Unarmored Defense formulas (only apply while wearing no armor) ────────────
// `shield: true` means the formula still works with a shield equipped.
export const UNARMORED_DEFENSE = {
  Barbarian: { abilities: ['CON'], label: 'Unarmored Defense (Barbarian)', shield: true },
  Monk: { abilities: ['WIS'], label: 'Unarmored Defense (Monk)', shield: false },
};

// ── Resolution ───────────────────────────────────────────────────────────────
/** Merge a library base over an instance into one read-friendly object.
 *  `base` may be null/undefined (legacy or not-yet-loaded) — callers should
 *  guard on `resolved.base`. */
export function resolveItem(instance, base) {
  const props = [
    ...((base && base.properties) || []),
    ...(instance.bonusProperties
      ? String(instance.bonusProperties).split(',').map(s => s.trim()).filter(Boolean)
      : []),
  ];
  return {
    instance,
    base: base || null,
    name: instance.customName || (base && base.name) || instance.name || 'Item',
    kind: (base && base.kind) || instance.kind || 'gear',
    properties: props,
    magicBonus: Number(instance.magicBonus) || 0,
  };
}

export function hasProperty(resolved, prop) {
  return (resolved.properties || []).some(p => p.toLowerCase() === prop.toLowerCase());
}

// ── Attack derivation ────────────────────────────────────────────────────────
/** Which ability scores a weapon may use (returns one or more — best is taken). */
export function attackAbilities(resolved) {
  const inst = resolved.instance;
  if (inst.abilityOverride) return [inst.abilityOverride];
  if (resolved.base && resolved.base.default_ability) return [resolved.base.default_ability];
  const finesse = hasProperty(resolved, 'finesse');
  if (resolved.kind === 'ranged') return ['DEX'];
  if (finesse) return ['STR', 'DEX'];
  return ['STR'];
}

/** Pick the highest-scoring of a weapon's allowed abilities. */
export function bestAttackAbility(resolved, abilities) {
  const opts = attackAbilities(resolved);
  return opts.reduce((best, ab) =>
    (abilities[ab] || 10) > (abilities[best] || 10) ? ab : best, opts[0]);
}

/**
 * Build a render-ready attack from a resolved weapon.
 * Returns null for non-weapon kinds.
 */
export function weaponAttack(resolved, abilities, level, { proficient = true } = {}) {
  if (!WEAPON_KINDS.has(resolved.kind)) return null;
  const base = resolved.base || {};
  const ability = bestAttackAbility(resolved, abilities);
  const mod = abilityMod(abilities[ability] || 10);
  const profBonus = proficient ? proficiencyBonus(level) : 0;
  const magic = resolved.magicBonus;
  const toHit = mod + profBonus + magic;
  const dmgMod = mod + magic;
  const dice = base.damage_dice || '1d4';
  const versatile = base.versatile_dice
    ? `Versatile (${base.versatile_dice}${magic ? formatMod(magic) : ''} ${base.damage_type || ''})`.trim()
    : null;
  const range = resolved.kind === 'ranged' || hasProperty(resolved, 'thrown')
    ? (base.range_normal ? `${base.range_normal} ft` : 'ranged')
    : 'melee';
  const noteParts = [];
  if (resolved.properties.length) noteParts.push(resolved.properties.join(', '));
  if (versatile) noteParts.push(versatile);
  return {
    name: resolved.name,
    ability,
    toHit,
    damageDice: dice,
    damageMod: dmgMod,
    damageType: base.damage_type || '',
    range: resolved.kind === 'ranged' ? 'ranged' : (hasProperty(resolved, 'thrown') ? 'thrown' : 'melee'),
    rangeLabel: range,
    magicBonus: magic,
    note: noteParts.join(' · '),
  };
}

// ── AC computation ───────────────────────────────────────────────────────────
/**
 * Compute AC from equipped armor/shield, falling back to the best unarmored
 * formula the character qualifies for, plus a persistent `combat.acOther`.
 *
 * @param resolvedEquipped array of resolveItem() results that are equipped
 * @returns { total, source, manual:false } or null when nothing to compute
 *          (legacy: no equipped armor/shield) so callers can keep manual AC.
 */
export function computeAC(character, resolvedEquipped, abilities) {
  // The AC-defining body armor is the equipped kind:'armor' item that actually
  // carries a base AC. Other armor-kind items worn elsewhere (e.g. magic boots
  // with no AC of their own) must not override it — prefer the 'body' slot, then
  // the highest base AC.
  const armor = resolvedEquipped
    .filter(r => r.kind === 'armor' && r.base && r.base.base_ac != null)
    .sort((a, b) => {
      const slotRank = (a.instance.slot === 'body' ? 1 : 0) - (b.instance.slot === 'body' ? 1 : 0);
      return slotRank !== 0 ? -slotRank : (b.base.base_ac || 0) - (a.base.base_ac || 0);
    })[0] || null;
  const shield = resolvedEquipped.find(r => r.kind === 'shield') || null;
  const acOther = Number(character.combat?.acOther) || 0;

  // Legacy guard: with nothing slotted and no persistent modifier, keep the
  // character's manual AC. Once any gear is equipped (or Other is set), compute.
  if (resolvedEquipped.length === 0 && acOther === 0) return null;

  const dexMod = abilityMod(abilities.DEX || 10);
  const className = character.meta?.className;
  const parts = [];
  let base;

  if (armor && armor.base) {
    const cap = armor.base.dex_cap;
    const dexContribution = cap == null ? dexMod : Math.min(dexMod, cap);
    base = (armor.base.base_ac || 10) + dexContribution + armor.magicBonus;
    parts.push(armor.name + (armor.magicBonus ? ` ${formatMod(armor.magicBonus)}` : ''));
  } else {
    // Unarmored: best of 10+DEX and any class formula the character qualifies for.
    base = 10 + dexMod;
    let label = 'Unarmored';
    const ud = className && UNARMORED_DEFENSE[className];
    if (ud && (ud.shield || !shield)) {
      const udValue = 10 + dexMod + ud.abilities.reduce((s, ab) => s + abilityMod(abilities[ab] || 10), 0);
      if (udValue > base) { base = udValue; label = ud.label; }
    }
    parts.push(label);
  }

  let total = base;
  if (shield && shield.base) {
    total += (shield.base.base_ac || 2) + shield.magicBonus;
    parts.push('Shield' + (shield.magicBonus ? ` ${formatMod(shield.magicBonus)}` : ''));
  }
  if (acOther) {
    total += acOther;
    parts.push(`Other ${formatMod(acOther)}`);
  }

  return { total, source: parts.join(' + '), manual: false };
}

// ── Charges & recharge ───────────────────────────────────────────────────────
/** Roll a dice expression like "1d6+1" / "2d4" / "3"; returns an integer. */
export function rollDice(expr) {
  if (expr == null) return 0;
  if (typeof expr === 'number') return expr;
  const m = String(expr).trim().match(/^(\d+)d(\d+)\s*([+-]\s*\d+)?$/i);
  if (!m) { const n = parseInt(expr, 10); return Number.isNaN(n) ? 0 : n; }
  const count = parseInt(m[1], 10), sides = parseInt(m[2], 10);
  const flat = m[3] ? parseInt(m[3].replace(/\s/g, ''), 10) : 0;
  let sum = flat;
  for (let i = 0; i < count; i++) sum += 1 + Math.floor(Math.random() * sides);
  return sum;
}

/** Does a recharge policy fire on this rest type? Long rest also covers 'dawn'. */
function rechargeFires(on, restType) {
  if (on === 'short') return restType === 'short' || restType === 'long';
  if (on === 'long' || on === 'dawn') return restType === 'long';
  return false; // 'manual' / unknown
}

/**
 * Refill charges on the given rest. Returns a NEW items array (instances with
 * charges replaced where they recharged) and a `changed` flag.
 * @param cache map of refId -> base library row (for max_charges / recharge)
 */
export function rechargeItems(items, restType, cache) {
  let changed = false;
  const next = (items || []).map((inst) => {
    if (inst.refType !== 'item') return inst;
    const base = cache[inst.refId];
    const hasCharges = inst.has_charges ?? (base && base.has_charges);
    if (!hasCharges) return inst;
    const max = (inst.maxCharges ?? (base && base.max_charges)) || 0;
    const policy = inst.recharge || (base && base.recharge) || null;
    if (!policy || !rechargeFires(policy.on, restType)) return inst;
    const cur = Number(inst.charges) || 0;
    let restored = cur;
    if (policy.amount === 'all' || policy.amount == null) restored = max;
    else restored = Math.min(max, cur + rollDice(policy.amount));
    if (restored !== cur) { changed = true; return { ...inst, charges: restored }; }
    return inst;
  });
  return { items: next, changed };
}
