import { useState } from 'react';
import { Check } from 'lucide-react';
import { getRoots, getClass } from '../../rules/registry';
import { classAccent } from '../Encyclopedia/accents';
import ClassDetailView from '../Encyclopedia/ClassDetailView';
import SubclassPicker from '../SubclassPicker';
import ChooserShell from './ChooserShell';
import ClassSetup from './ClassSetup';
import { classSetupPatch } from './creationUtils';

/**
 * Class step. Lists the classes; the detail pane reuses the encyclopedia
 * ClassDetailView. Classes whose subclass is chosen at level 1 (Cleric, Sorcerer,
 * Warlock) get an optional subclass picker here (the same SubclassPicker used on
 * the sheet); the rest show a note that they choose later.
 */
export default function ClassStep({ draft, setDraft }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const classes = getRoots('class').slice().sort((a, b) => a.name.localeCompare(b.name));
  const className = draft.meta.className || null;
  const subclass = draft.meta.subclass || '';
  const node = className ? getClass(className) : null;
  const accent = classAccent(className);

  const items = classes.map(n => {
    const subCount = (n.childIds || []).length;
    return { id: n.id, name: n.name, meta: subCount > 0 ? `${subCount} ${n.subclassLabel || 'subclass'}${subCount > 1 ? 'es' : ''}` : undefined };
  });

  const selectClass = (name) => {
    if (name === className) return;
    // Apply the new class's level-1 grants (clears any prior class's grants).
    setDraft({ meta: { className: name, subclass: '' }, ...classSetupPatch(draft, name, [], {}) });
  };

  const renderDetail = (name) => {
    const cNode = getClass(name);
    const picksAtOne = (cNode?.subclassLevel || 3) <= 1;
    const label = cNode?.subclassLabel || 'Subclass';
    return (
      <div>
        <ClassDetailView key={name} nodeId={name} accent={accent} editMode={false} onOpen={() => {}} />
        <div className="crt-subclass-slot">
          {picksAtOne ? (
            subclass ? (
              <div className="crt-subclass-chosen">
                <Check size={15} /> <span><strong>{subclass}</strong> chosen as your {label}.</span>
                <button className="crt-linkbtn" onClick={() => setPickerOpen(true)}>Change</button>
              </div>
            ) : (
              <div className="crt-subclass-prompt">
                <span>Your {label} is chosen at level 1.</span>
                <button className="crt-btn crt-btn--accent" onClick={() => setPickerOpen(true)}>
                  Choose {label}
                </button>
              </div>
            )
          ) : (
            <p className="crt-hint-inline">
              You'll choose your {label} at level {cNode?.subclassLevel || 3} — the sheet will prompt you at level-up.
            </p>
          )}
        </div>

        <ClassSetup draft={draft} setDraft={setDraft} />

        {pickerOpen && (
          <SubclassPicker
            className={name}
            subclassLabel={label}
            currentSubclass={subclass}
            onConfirm={(sc) => { setDraft({ meta: { subclass: sc } }); setPickerOpen(false); }}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>
    );
  };

  return (
    <ChooserShell
      items={items}
      selectedId={className}
      onSelect={selectClass}
      renderDetail={renderDetail}
      accent={accent}
      emptyHint="Pick a class on the left — this is your character's biggest mechanical choice."
    />
  );
}
