/**
 * Default racial ability-score bonuses (race + subrace, summed by the consumer).
 * These are the DEFAULT placements only — the character model stores an editable
 * allocation so a player can move bonuses elsewhere (loose by design). Authored
 * from canonical 5e where the legacy prose omitted them; homebrew races are
 * best-effort and player-correctable.
 *
 * Floating bonuses (Half-Elf's two +1s, Human variant) are intentionally left
 * for the player to allocate rather than hardcoded.
 */
export const RACE_ABILITY_BONUSES = {
  Dragonborn: { STR: 2, CHA: 1 },
  Dwarf:      { CON: 2 },
  Elf:        { DEX: 2 },
  Fairy:      { DEX: 2, CHA: 1 },
  Genasi:     { CON: 2 },
  Gnome:      { INT: 2 },
  Goliath:    { STR: 2, CON: 1 },
  'Half-Elf': { CHA: 2 },              // + two floating +1s (player-allocated)
  'Half-Orc': { STR: 2, CON: 1 },
  Halfling:   { DEX: 2 },
  Human:      { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 },
  Tabaxi:     { DEX: 2, CHA: 1 },
  Tiefling:   { CHA: 2 },              // bloodline supplies the second +1
  Uma:        { WIS: 2 },              // homebrew — best guess, editable
};

export const SUBRACE_ABILITY_BONUSES = {
  'Hill Dwarf':     { WIS: 1 },
  'Mountain Dwarf': { STR: 2 },
  'Dark Elf':       { CHA: 1 },
  'High Elf':       { INT: 1 },
  'Wood Elf':       { WIS: 1 },
  'Air Genasi':     { DEX: 1 },
  'Earth Genasi':   { STR: 1 },
  'Fire Genasi':    { INT: 1 },
  'Water Genasi':   { WIS: 1 },
  'Forest Gnome':   { DEX: 1 },
  'Rock Gnome':     { CON: 1 },
  Lightfoot:        { CHA: 1 },
  Stout:            { CON: 1 },
  'Bloodline of Asmodeus':       { INT: 1 },
  'Bloodline of Baalzebul':      { INT: 1 },
  'Bloodline of Dispater':       { DEX: 1 },
  'Bloodline of Fierna':         { WIS: 1 },
  'Bloodline of Glasya':         { DEX: 1 },
  'Bloodline of Levistus':       { CON: 1 },
  'Bloodline of Mammon':         { INT: 1 },
  'Bloodline of Mephistopheles': { INT: 1 },
  'Bloodline of Zariel':         { STR: 1 },
};
