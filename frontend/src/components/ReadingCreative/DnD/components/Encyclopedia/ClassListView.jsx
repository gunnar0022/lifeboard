import { ChevronRight } from 'lucide-react';
import { getRoots } from '../../rules/registry';
import { classAccent } from './accents';

// Base-class card one-liners are hard-coded so the grid paints instantly instead
// of popping in after the async lore fetch. Each class's full, editable tagline
// still lives in the DB and shows on its detail page; this is just the at-a-glance
// hook for the list. Keep in sync if you rename a class's tagline.
const CLASS_TAGLINES = {
  Barbarian: 'A fury-fueled warrior of primal might.',
  Bard: 'A jack-of-all-trades whose art is magic.',
  Cleric: 'A divine conduit of healing and judgment.',
  Druid: 'A shapeshifting guardian of the wild.',
  Fighter: 'The master of weapons and war.',
  Monk: 'A martial artist who weaponizes inner ki.',
  Paladin: 'A holy warrior bound by a sacred oath.',
  Ranger: 'A keen-eyed hunter bonded to the wild.',
  Rogue: 'A precise, elusive expert and skirmisher.',
  Sorcerer: 'A born spellcaster who bends magic itself.',
  Warlock: 'A pact-bound wielder of borrowed power.',
  Wizard: 'The scholar who masters all arcane magic.',
  Artificer: 'An inventor who infuses items with magic.',
};

/**
 * The classes grid. Each calling is one card, tinted with its class color, with
 * a hint at how many subclass paths branch from it.
 */
export default function ClassListView({ onOpen }) {
  const classes = getRoots('class').slice().sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="wiki-list">
      <h2 className="wiki-list__title">Classes</h2>
      <div className="wiki-cards">
        {classes.map(node => {
          const subCount = (node.childIds || []).length;
          return (
            <button
              key={node.id}
              className="wiki-card"
              style={{ '--accent': classAccent(node.name) }}
              onClick={() => onOpen(node)}
            >
              <span className="wiki-card__accent" />
              <span className="wiki-card__body">
                <span className="wiki-card__name">{node.name}</span>
                {CLASS_TAGLINES[node.name] && <span className="wiki-card__tagline">{CLASS_TAGLINES[node.name]}</span>}
                {subCount > 0 && (
                  <span className="wiki-card__meta">{subCount} {node.subclassLabel || 'subclass'}{subCount > 1 ? 's' : ''}</span>
                )}
              </span>
              <ChevronRight className="wiki-card__chev" size={18} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
