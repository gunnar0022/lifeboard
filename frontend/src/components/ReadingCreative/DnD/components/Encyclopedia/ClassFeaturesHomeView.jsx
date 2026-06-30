import { ChevronRight } from 'lucide-react';
import { OPTION_CATEGORIES } from '../OptionPicker/optionLibraries';
import { pickerTheme } from '../OptionPicker/pickerThemes';

/**
 * "Class Features" home — the grid of class-option libraries (Invocations,
 * Metamagic, Infusions, Maneuvers, Arcane Shots, Runes). Each card carries its
 * picker accent + icon so the family reads at a glance, and opens the themed
 * read-only library list.
 */
export default function ClassFeaturesHomeView({ onOpenCategory }) {
  return (
    <div className="wiki-home">
      <h2 className="wiki-list__title">Class Features</h2>
      <p className="wiki-home__lede">
        The choosable option libraries behind the martial and arcane classes — browse every invocation,
        maneuver, infusion, and more, the same lists your characters pick from on level-up.
      </p>
      <div className="wiki-home__pillars">
        {OPTION_CATEGORIES.map(cat => {
          const theme = pickerTheme(cat.key);
          const { Icon } = theme;
          return (
            <button
              key={cat.key}
              className="wiki-pillar wiki-pillar--themed"
              style={{ '--accent': theme.accent }}
              onClick={() => onOpenCategory(cat.key, cat.label)}
            >
              <Icon className="wiki-pillar__icon" size={28} />
              <span className="wiki-pillar__label">{cat.label}</span>
              <span className="wiki-pillar__blurb">{cat.owner}</span>
              <ChevronRight className="wiki-pillar__chev" size={16} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
