import { ChevronsUp, ScrollText } from 'lucide-react';

/**
 * Top-bar cluster: a quiet recap button (left) and the flashy Level Up button
 * (right) that reads "[current] → [next]" so it's clear what the click does.
 * Sits in the top-right area, offset to the left of the Edit toggle.
 */
export default function LevelUpControls({ level, onLevelUp, onRecap }) {
  const atMax = level >= 20;
  return (
    <div className="dnd-levelup-ctrls">
      <button
        className="dnd-levelup-recap"
        onClick={onRecap}
        title="Recap this level's benefits"
        aria-label="Recap this level's benefits"
      >
        <ScrollText size={16} />
      </button>
      <button
        className="dnd-levelup-btn"
        onClick={onLevelUp}
        disabled={atMax}
        title={atMax ? 'Maximum level reached' : `Level up to ${level + 1}`}
      >
        <ChevronsUp size={18} className="dnd-levelup-btn__icon" />
        <span className="dnd-levelup-btn__text">
          <span className="dnd-levelup-btn__kicker">{atMax ? 'Max Level' : 'Level Up'}</span>
          {atMax ? (
            <span className="dnd-levelup-btn__to">{level}</span>
          ) : (
            <span className="dnd-levelup-btn__nums">
              <span className="dnd-levelup-btn__from">{level}</span>
              <span className="dnd-levelup-btn__arrow">→</span>
              <span className="dnd-levelup-btn__to">{level + 1}</span>
            </span>
          )}
        </span>
      </button>
    </div>
  );
}
