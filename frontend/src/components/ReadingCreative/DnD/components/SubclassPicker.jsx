import { useState } from 'react';
import { X, Check, ChevronRight } from 'lucide-react';
import { getChildren } from '../rules/registry';
import { classAccent } from './Encyclopedia/accents';
import useLoreOverrides from './Encyclopedia/useLoreOverrides';
import ClassDetailView from './Encyclopedia/ClassDetailView';

/**
 * Top-layer chooser for a character's subclass. Given the class, it lists only
 * that class's subclasses (names), and reads the FULL encyclopedia detail for the
 * highlighted one through the same getNodeDetail surface the wiki uses — so the
 * 100+ subclasses are all covered with zero per-subclass wiring. Confirming locks
 * the choice into character.meta.subclass via onConfirm(name).
 */
export default function SubclassPicker({ className, subclassLabel, currentSubclass, onConfirm, onClose }) {
  const accent = classAccent(className);
  const label = subclassLabel || 'Subclass';
  const subclasses = getChildren(className).slice().sort((a, b) => a.name.localeCompare(b.name));
  const [selected, setSelected] = useState(currentSubclass || null);
  const { overrides } = useLoreOverrides();

  const onOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="dnd-subpick__overlay" onClick={onOverlayClick}>
      <div className="dnd-subpick" role="dialog" aria-modal="true" style={{ '--accent': accent }}>
        <header className="dnd-subpick__head">
          <div className="dnd-subpick__heading">
            <span className="dnd-subpick__kicker">Choose your {label}</span>
            <h3 className="dnd-subpick__title">{className}</h3>
          </div>
          <button className="dnd-subpick__close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>

        <div className="dnd-subpick__body">
          <nav className="dnd-subpick__list">
            {subclasses.length === 0 && (
              <p className="dnd-subpick__empty">No subclasses found for {className}.</p>
            )}
            {subclasses.map(sc => (
              <button
                key={sc.id}
                className={`dnd-subpick__item ${selected === sc.name ? 'dnd-subpick__item--active' : ''}`}
                onClick={() => setSelected(sc.name)}
              >
                <span className="dnd-subpick__item-name">{sc.name}</span>
                {!sc.implemented && <span className="dnd-subpick__item-soon">brief</span>}
                <ChevronRight size={14} className="dnd-subpick__item-chev" />
              </button>
            ))}
          </nav>

          <div className="dnd-subpick__detail">
            {selected ? (
              <ClassDetailView
                key={selected}
                nodeId={selected}
                accent={accent}
                onOpen={() => {}}
                editMode={false}
                override={overrides[selected]}
              />
            ) : (
              <p className="dnd-subpick__empty">Select a {label.toLowerCase()} on the left to read its full details.</p>
            )}
          </div>
        </div>

        <footer className="dnd-subpick__foot">
          <span className="dnd-subpick__chosen">
            {selected ? <>Selected: <strong>{selected}</strong></> : 'No selection yet'}
          </span>
          <button
            className="dnd-subpick__confirm"
            disabled={!selected}
            onClick={() => selected && onConfirm(selected)}
          >
            <Check size={15} /> Lock in {selected || label}
          </button>
        </footer>
      </div>
    </div>
  );
}
