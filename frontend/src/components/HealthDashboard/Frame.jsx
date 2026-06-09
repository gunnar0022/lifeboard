/**
 * Per-widget chrome. In reading mode it's invisible; in edit mode it
 * shows a header with up/down/hide controls and an inline rename field.
 */
import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, EyeOff, Pencil, Check } from 'lucide-react';

export default function WidgetFrame({
  widgetId,
  defaultLabel,
  customLabel,
  editMode,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onHide,
  onRename,
  children,
}) {
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(customLabel || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setDraftLabel(customLabel || '');
  }, [customLabel]);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const displayLabel = customLabel || defaultLabel;

  const commitRename = () => {
    const trimmed = draftLabel.trim();
    onRename(trimmed === '' || trimmed === defaultLabel ? null : trimmed);
    setEditing(false);
  };

  const cancelRename = () => {
    setDraftLabel(customLabel || '');
    setEditing(false);
  };

  return (
    <div className={`hd-frame ${editMode ? 'hd-frame--edit' : ''}`} data-widget-id={widgetId}>
      {editMode && (
        <div className="hd-frame__bar">
          <div className="hd-frame__title">
            {editing ? (
              <>
                <input
                  ref={inputRef}
                  className="hd-frame__rename-input"
                  value={draftLabel}
                  placeholder={defaultLabel}
                  onChange={e => setDraftLabel(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') cancelRename();
                  }}
                  onBlur={commitRename}
                  maxLength={48}
                />
                <button
                  className="hd-frame__btn hd-frame__btn--primary"
                  onMouseDown={e => e.preventDefault()}
                  onClick={commitRename}
                  title="Save"
                >
                  <Check size={13} />
                </button>
              </>
            ) : (
              <>
                <span className="hd-frame__label" onDoubleClick={() => setEditing(true)} title="Double-click to rename">
                  {displayLabel}
                </span>
                <button className="hd-frame__btn hd-frame__btn--ghost" onClick={() => setEditing(true)} title="Rename">
                  <Pencil size={11} />
                </button>
              </>
            )}
          </div>
          <div className="hd-frame__actions">
            <button
              className="hd-frame__btn"
              onClick={onMoveUp}
              disabled={isFirst}
              title="Move up"
            >
              <ChevronUp size={14} />
            </button>
            <button
              className="hd-frame__btn"
              onClick={onMoveDown}
              disabled={isLast}
              title="Move down"
            >
              <ChevronDown size={14} />
            </button>
            <button
              className="hd-frame__btn hd-frame__btn--danger"
              onClick={onHide}
              title="Hide widget"
            >
              <EyeOff size={13} />
            </button>
          </div>
        </div>
      )}
      <div className="hd-frame__body">{children}</div>
    </div>
  );
}
