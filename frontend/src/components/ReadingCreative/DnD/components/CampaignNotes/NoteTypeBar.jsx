const NOTE_TYPES = [
  { id: 'character', icon: '\uD83D\uDC64', label: 'Characters' },
  { id: 'place', icon: '\uD83D\uDCCD', label: 'Places' },
  { id: 'quest', icon: '\uD83D\uDCDC', label: 'Quests' },
  { id: 'item', icon: '\u2694', label: 'Items' },
  { id: 'note', icon: '\uD83D\uDCDD', label: 'Notes' },
];

export default function NoteTypeBar({ activeType, counts, onSelect }) {
  return (
    <div className="dnd-note-types">
      {NOTE_TYPES.map(t => (
        <button
          key={t.id}
          className={`dnd-note-types__btn ${activeType === t.id ? 'dnd-note-types__btn--active' : ''}`}
          onClick={() => onSelect(t.id)}
        >
          <span className="dnd-note-types__icon">{t.icon}</span>
          <span className="dnd-note-types__label">{t.label}</span>
          {(counts[t.id] || 0) > 0 && (
            <span className="dnd-note-types__count">{counts[t.id]}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export { NOTE_TYPES };
