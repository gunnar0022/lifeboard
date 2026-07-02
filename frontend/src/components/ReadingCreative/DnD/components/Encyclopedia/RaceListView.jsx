import { ChevronRight } from 'lucide-react';
import { getRoots, getNode } from '../../rules/registry';
import { raceAccent } from './accents';

// Base-race card one-liners are hard-coded so the grid paints instantly instead
// of popping in after the async lore fetch. Each race's full, editable tagline
// still lives in the DB and shows on its detail page; this is just the at-a-glance
// hook for the list. Keep in sync if you rename a race's tagline.
const RACE_TAGLINES = {
  Dragonborn: 'Proud dragon-blooded humanoids with a breath weapon.',
  Dwarf: 'Stout, stalwart folk of stone and forge.',
  Elf: 'Graceful, long-lived folk attuned to magic.',
  Fairy: 'Tiny winged folk of the Feywild.',
  Genasi: 'Elemental-touched humanoids of the planes.',
  Gnome: 'Small, brilliant, irrepressibly curious folk.',
  Goliath: 'Towering, competitive mountain dwellers.',
  'Half-Elf': 'Charismatic wanderers of two worlds.',
  'Half-Orc': 'Fierce, enduring folk of orcish strength.',
  Halfling: 'Small, brave, and improbably lucky folk.',
  Human: 'Ambitious, adaptable, and everywhere.',
  Tabaxi: 'Curious, catlike wanderers and collectors.',
  Tiefling: 'Fiend-blooded folk marked by infernal heritage.',
  Uma: 'Driven heirs to an eternal tradition of competition.',
};

/**
 * The major-races grid. Each major race is one card (Elf encompasses Wood/High/
 * Drow); the subrace count hints whether the page branches further. Tapping a
 * card pushes that race's detail frame.
 */
export default function RaceListView({ onOpen }) {
  const races = getRoots('race');
  return (
    <div className="wiki-list">
      <h2 className="wiki-list__title">Races</h2>
      <div className="wiki-cards">
        {races.map(node => {
          const accent = raceAccent(node.name);
          const subraceCount = (node.childIds || []).length;
          return (
            <button
              key={node.id}
              className="wiki-card"
              style={{ '--accent': accent }}
              onClick={() => onOpen(node)}
            >
              <span className="wiki-card__accent" />
              <span className="wiki-card__body">
                <span className="wiki-card__name">{node.name}</span>
                {RACE_TAGLINES[node.name] && <span className="wiki-card__tagline">{RACE_TAGLINES[node.name]}</span>}
                {subraceCount > 0 && (
                  <span className="wiki-card__meta">{subraceCount} lineage{subraceCount > 1 ? 's' : ''}</span>
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
