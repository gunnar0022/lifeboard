import { Check, ListTodo } from 'lucide-react';
import { getClass } from '../../rules/registry';
import { casterProfileFor } from '../../dndUtils';

const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

/**
 * Review step — a summary of every choice plus an explicit "still to do on your
 * sheet" checklist for the parts this guided flow doesn't cover yet (class
 * proficiencies/equipment come in a later phase; spells are always hands-on).
 */
export default function ReviewStep({ draft }) {
  const meta = draft.meta || {};
  const node = meta.className ? getClass(meta.className) : null;
  const isCaster = !!casterProfileFor(meta.className, meta.subclass);

  const subclassLine = meta.subclass
    ? meta.subclass
    : node ? `Chosen at level ${node.subclassLevel || 3}` : '—';

  const rows = [
    ['Race', meta.subrace ? `${meta.race} · ${meta.subrace}` : (meta.race || '—')],
    ['Class', meta.className || '—'],
    [node?.subclassLabel || 'Subclass', subclassLine],
    ['Background', meta.background || 'Custom / none'],
    ['Alignment', meta.alignment || '—'],
    ['Name', meta.name?.trim() || 'New Character'],
  ];

  const abilities = draft.abilities || {};

  const todo = [
    isCaster && 'Your starting cantrips and spells (Spells tab)',
    'Any extra languages your race or table grants',
    'Fine-tune starting equipment on the Equipment tab (magic items, quantities, what\'s equipped)',
  ].filter(Boolean);

  return (
    <div className="crt-review">
      <div className="crt-review__grid">
        {rows.map(([label, val]) => (
          <div key={label} className="crt-review__row">
            <span className="crt-review__label">{label}</span>
            <span className="crt-review__val">{val}</span>
          </div>
        ))}
      </div>

      <div className="crt-review__abilities">
        {ABILITIES.map(ab => (
          <div key={ab} className="crt-review__ability">
            <span className="crt-review__ability-name">{ab}</span>
            <span className="crt-review__ability-score">{abilities[ab] ?? 8}</span>
          </div>
        ))}
      </div>

      <div className="crt-review__todo">
        <h4 className="crt-subhead"><ListTodo size={15} /> Still to do on your sheet</h4>
        <ul>
          {todo.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
        <p className="crt-hint-inline">Create the character and the full sheet opens in edit mode to finish these.</p>
      </div>

      <div className="crt-review__ready"><Check size={16} /> Ready to create.</div>
    </div>
  );
}
