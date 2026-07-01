const ROWS = [
  ['Lawful Good', 'Neutral Good', 'Chaotic Good'],
  ['Lawful Neutral', 'True Neutral', 'Chaotic Neutral'],
  ['Lawful Evil', 'Neutral Evil', 'Chaotic Evil'],
];

/**
 * Alignment step — a 3×3 moral/order grid. Optional; a roleplay compass with
 * almost no mechanical weight in modern play.
 */
export default function AlignmentStep({ draft, setDraft }) {
  const current = draft.meta.alignment || '';
  return (
    <div className="crt-alignment">
      <div className="crt-alignment__grid">
        {ROWS.flat().map(a => (
          <button
            key={a}
            className={`crt-alignment__cell ${current === a ? 'crt-alignment__cell--active' : ''}`}
            onClick={() => setDraft({ meta: { alignment: current === a ? '' : a } })}
          >
            {a}
          </button>
        ))}
      </div>
      <p className="crt-hint-inline">Optional — pick the one that fits, or leave it blank and decide at the table.</p>
    </div>
  );
}
