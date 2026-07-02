import { ChevronRight } from 'lucide-react';
import { getRoots, getNode } from '../../rules/registry';
import { raceAccent } from './accents';
import useLoreOverrides from './useLoreOverrides';

/**
 * The major-races grid. Each major race is one card (Elf encompasses Wood/High/
 * Drow); the subrace count hints whether the page branches further. Tapping a
 * card pushes that race's detail frame.
 */
export default function RaceListView({ onOpen }) {
  const races = getRoots('race');
  const { overrides } = useLoreOverrides();
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
                {overrides[node.id]?.tagline && <span className="wiki-card__tagline">{overrides[node.id].tagline}</span>}
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
