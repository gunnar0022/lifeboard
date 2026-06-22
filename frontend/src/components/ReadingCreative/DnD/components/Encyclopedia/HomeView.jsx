import { Users, Swords, Sparkles } from 'lucide-react';

/**
 * Encyclopedia home — the three pillars. Races is live in this slice; Classes
 * and Spells are shown but flagged "in progress" so the shell reads complete
 * while we nail the Races vertical first.
 */
const PILLARS = [
  { id: 'races', label: 'Races', Icon: Users, blurb: 'Ancestries and their bloodlines — from the elves and their kin to dragon-blooded and the small folk.', ready: true },
  { id: 'classes', label: 'Classes', Icon: Swords, blurb: 'Callings and the paths within them — what each class plays like and where its subclasses lead.', ready: true },
  { id: 'spells', label: 'Spells', Icon: Sparkles, blurb: 'The full library, filterable by level, class, and casting time.', ready: true },
];

export default function HomeView({ onOpen }) {
  return (
    <div className="wiki-home">
      <h2 className="wiki-home__title">Encyclopedia</h2>
      <p className="wiki-home__lede">Browse the rules like a tree — tunnel into a topic, then step back out one level at a time or jump straight home.</p>
      <div className="wiki-home__pillars">
        {PILLARS.map(({ id, label, Icon, blurb, ready }) => (
          <button
            key={id}
            className={`wiki-pillar ${ready ? '' : 'wiki-pillar--soon'}`}
            onClick={() => ready && onOpen(id)}
            disabled={!ready}
          >
            <Icon className="wiki-pillar__icon" size={28} />
            <span className="wiki-pillar__label">{label}</span>
            <span className="wiki-pillar__blurb">{blurb}</span>
            {!ready && <span className="wiki-pillar__badge">In progress</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
