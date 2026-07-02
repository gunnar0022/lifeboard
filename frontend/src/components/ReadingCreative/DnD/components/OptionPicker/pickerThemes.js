/**
 * Per-picker visual identity for the OptionPicker modal. Each theme drives a
 * bespoke skin (`skin` → CSS modifier class `op-picker--{skin}`) plus the accent
 * color, header icon, and flavor copy. Adding a picker = add a theme here and a
 * matching `op-picker--{skin}` block in option-picker.css.
 */
import { Eye, Cog, Swords, Flame, Target, Mountain, Star, Shield } from 'lucide-react';

export const PICKER_THEMES = {
  fightingStyle: {
    skin: 'fightingstyle',
    accent: 'var(--dnd-class-fighter)',
    Icon: Shield,
    title: 'Fighting Style',
    tagline: 'Drill a signature technique into muscle and steel.',
  },
  invocations: {
    skin: 'warlock',
    accent: 'var(--dnd-class-warlock)',
    Icon: Eye,
    title: 'Eldritch Invocations',
    tagline: 'Forbidden knowledge, whispered by your patron.',
  },
  infusions: {
    skin: 'artificer',
    accent: 'var(--dnd-class-artificer)',
    Icon: Cog,
    title: 'Artificer Infusions',
    tagline: 'Imbue ordinary objects with arcane ingenuity.',
  },
  maneuvers: {
    skin: 'battlemaster',
    accent: 'var(--dnd-class-fighter)',
    Icon: Swords,
    title: 'Combat Maneuvers',
    tagline: 'Disciplined techniques, executed with precision.',
  },
  metamagic: {
    skin: 'sorcerer',
    accent: 'var(--dnd-class-sorcerer)',
    Icon: Flame,
    title: 'Metamagic',
    tagline: 'Bend the raw stuff of magic to your will.',
  },
  arcaneShots: {
    skin: 'arcanearcher',
    accent: '#5c8a3a', // fletched green — distinct from the Battle Master steel
    Icon: Target,
    title: 'Arcane Shots',
    tagline: 'Enchant your arrows with eldritch precision.',
  },
  runes: {
    skin: 'runeknight',
    accent: '#c08a3e', // giant-rune amber/stone
    Icon: Mountain,
    title: 'Giant Runes',
    tagline: 'Carve the runes of giants into your gear.',
  },
  feats: {
    skin: 'feats',
    accent: 'var(--dnd-accent)',
    Icon: Star,
    title: 'Feats',
    tagline: 'Exceptional talents beyond your calling.',
  },
};

export function pickerTheme(key) {
  return PICKER_THEMES[key] || PICKER_THEMES.feats;
}
