import { ChevronRight } from 'lucide-react';
import { getRoots } from '../../rules/registry';
import { classAccent } from './accents';
import useLoreOverrides from './useLoreOverrides';

/**
 * The classes grid. Each calling is one card, tinted with its class color, with
 * a hint at how many subclass paths branch from it.
 */
export default function ClassListView({ onOpen }) {
  const classes = getRoots('class').slice().sort((a, b) => a.name.localeCompare(b.name));
  const { overrides } = useLoreOverrides();
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
                {overrides[node.id]?.tagline && <span className="wiki-card__tagline">{overrides[node.id].tagline}</span>}
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
